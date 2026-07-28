import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ownerPasswordHash = await hash("password123", 10);
  const adminPasswordHash = await hash("password123", 10);

  const organization = await prisma.organization.upsert({
    where: { slug: "acme-inc" },
    update: {
      webhookApiKey: "cp_wh_seed_acme_primary",
    },
    create: {
      name: "Acme Inc.",
      slug: "acme-inc",
      webhookApiKey: "cp_wh_seed_acme_primary",
      users: {
        create: {
          email: "owner@acme.dev",
          name: "Acme Owner",
          role: "OWNER",
          passwordHash: ownerPasswordHash,
        },
      },
    },
  });

  const secondOrganization = await prisma.organization.upsert({
    where: { slug: "beta-labs" },
    update: {
      webhookApiKey: "cp_wh_seed_beta_secondary",
    },
    create: {
      name: "Beta Labs",
      slug: "beta-labs",
      webhookApiKey: "cp_wh_seed_beta_secondary",
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@acme.dev" },
    update: {
      name: "Acme Owner",
      passwordHash: ownerPasswordHash,
      organizationId: organization.id,
      currentOrganizationId: organization.id,
      role: "OWNER",
    },
    create: {
      email: "owner@acme.dev",
      name: "Acme Owner",
      passwordHash: ownerPasswordHash,
      role: "OWNER",
      organizationId: organization.id,
      currentOrganizationId: organization.id,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@acme.dev" },
    update: {
      name: "Acme Admin",
      passwordHash: adminPasswordHash,
      organizationId: organization.id,
      currentOrganizationId: organization.id,
      role: "ADMIN",
    },
    create: {
      email: "admin@acme.dev",
      name: "Acme Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      organizationId: organization.id,
      currentOrganizationId: organization.id,
    },
  });

  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId: ownerUser.id,
        organizationId: organization.id,
      },
    },
    update: { role: "OWNER" },
    create: {
      userId: ownerUser.id,
      organizationId: organization.id,
      role: "OWNER",
    },
  });

  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId: ownerUser.id,
        organizationId: secondOrganization.id,
      },
    },
    update: { role: "ADMIN" },
    create: {
      userId: ownerUser.id,
      organizationId: secondOrganization.id,
      role: "ADMIN",
    },
  });

  await prisma.organizationMembership.upsert({
    where: {
      userId_organizationId: {
        userId: adminUser.id,
        organizationId: organization.id,
      },
    },
    update: { role: "ADMIN" },
    create: {
      userId: adminUser.id,
      organizationId: organization.id,
      role: "ADMIN",
    },
  });

  // Project 1: a real, small, always-available public GitHub repo. This lets
  // the analyze-repo-queue worker exercise the real Octokit + AI pipeline
  // end-to-end without needing a private token or a huge codebase.
  const githubProject = await prisma.project.upsert({
    where: { id: "seed-project-github" },
    update: {},
    create: {
      id: "seed-project-github",
      name: "octocat/Hello-World",
      sourceType: "GITHUB_REPO",
      githubRepoUrl: "https://github.com/octocat/Hello-World",
      organizationId: organization.id,
    },
  });

  // Project 2: an example monitored API endpoint (no GitHub data — this
  // source type is analyzed from performance/log metrics instead).
  const apiProject = await prisma.project.upsert({
    where: { id: "seed-project-api" },
    update: {},
    create: {
      id: "seed-project-api",
      name: "Acme Checkout API",
      sourceType: "API_ENDPOINT",
      apiUrl: "https://api.acme.dev/v1/checkout",
      organizationId: organization.id,
    },
  });

  await prisma.analysisResult.upsert({
    where: { id: "seed-analysis-github" },
    update: {},
    create: {
      id: "seed-analysis-github",
      projectId: githubProject.id,
      status: "COMPLETED",
      severity: "LOW",
      aiScore: 82,
      summary: "Repositorio de ejemplo saludable, con historial de commits estable.",
      aiInsight:
        "## Resumen\nEl repositorio no muestra hallazgos críticos.\n\n### Sugerencias\n" +
        "- Agregar un pipeline de CI/CD si el proyecto crece más allá de un ejemplo.\n" +
        "- Documentar el propósito del repositorio con mayor detalle en el README.",
      rawMetrics: { commitsAnalyzed: 3, openIssues: 0 },
      errorCount: 0,
      startedAt: new Date(Date.now() - 60_000),
      completedAt: new Date(),
    },
  });

  await prisma.analysisResult.upsert({
    where: { id: "seed-analysis-api" },
    update: {},
    create: {
      id: "seed-analysis-api",
      projectId: apiProject.id,
      status: "COMPLETED",
      severity: "MEDIUM",
      aiScore: 68,
      summary: "Se detectó una regresión de latencia p95 en /checkout",
      aiInsight:
        "## Resumen\nLa latencia p95 del endpoint `/checkout` aumentó 35% tras el último " +
        "deploy, probablemente por una consulta sin índice sobre la tabla `orders`.\n\n" +
        "### Sugerencias\n- Agregar un índice compuesto en `(organization_id, created_at)`.\n" +
        "- Revisar el plan de ejecución de la query principal del endpoint.\n" +
        "- Configurar alertas cuando p95 supere 300ms.",
      rawMetrics: { p95Before: 305, p95After: 412 },
      errorCount: 3,
      latencyMsP95: 412,
      startedAt: new Date(Date.now() - 120_000),
      completedAt: new Date(Date.now() - 60_000),
    },
  });

  const historicalAnalyses = [
    {
      id: "seed-analysis-github-week-4",
      projectId: githubProject.id,
      severity: "MEDIUM" as const,
      aiScore: 61,
      summary: "Se detectaron oportunidades de mejora en documentación y automatización.",
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    },
    {
      id: "seed-analysis-github-week-3",
      projectId: githubProject.id,
      severity: "LOW" as const,
      aiScore: 69,
      summary: "La salud general mejoró tras tareas de mantenimiento básicas.",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    },
    {
      id: "seed-analysis-github-week-2",
      projectId: githubProject.id,
      severity: "LOW" as const,
      aiScore: 76,
      summary: "Se observa una mejora sostenida del score del repositorio.",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      id: "seed-analysis-api-week-4",
      projectId: apiProject.id,
      severity: "HIGH" as const,
      aiScore: 54,
      summary: "Latencia p95 elevada y errores intermitentes en checkout.",
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    },
    {
      id: "seed-analysis-api-week-3",
      projectId: apiProject.id,
      severity: "HIGH" as const,
      aiScore: 58,
      summary: "Persisten cuellos de botella en la ruta de checkout.",
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    },
    {
      id: "seed-analysis-api-week-2",
      projectId: apiProject.id,
      severity: "MEDIUM" as const,
      aiScore: 63,
      summary: "Las optimizaciones redujeron parcialmente la latencia observada.",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const item of historicalAnalyses) {
    await prisma.analysisResult.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        projectId: item.projectId,
        status: "COMPLETED",
        severity: item.severity,
        aiScore: item.aiScore,
        summary: item.summary,
        aiInsight:
          "## Resumen\nHistórico de auditoría para poblar el dashboard de overview.\n\n### Acción sugerida\n- Continuar monitoreando la tendencia de salud semanal.",
        rawMetrics: { seeded: true },
        errorCount: item.aiScore < 60 ? 2 : 0,
        latencyMsP95: item.projectId === apiProject.id ? 350 - item.aiScore : null,
        startedAt: item.createdAt,
        completedAt: item.createdAt,
        createdAt: item.createdAt,
      },
    });
  }

  await prisma.notification.upsert({
    where: { id: "seed-notification-welcome" },
    update: {},
    create: {
      id: "seed-notification-welcome",
      organizationId: organization.id,
      title: "Centro de alertas activo",
      message:
        "Las notificaciones críticas aparecerán aquí cuando un análisis detecte severidad HIGH/CRITICAL o un AI Score menor a 60.",
      type: "INFO",
      read: false,
    },
  });

  await prisma.organizationInvitation.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: "invited@acme.dev",
      },
    },
    update: {
      role: "MEMBER",
      token: "seed-invite-token-acme",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    create: {
      organizationId: organization.id,
      email: "invited@acme.dev",
      role: "MEMBER",
      token: "seed-invite-token-acme",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(
    `Seeded organization "${organization.name}" with projects "${githubProject.name}" and "${apiProject.name}"`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
