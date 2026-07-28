"use client";

import { useActionState, useState } from "react";
import { Building2, CheckCircle2, Loader2, Rocket, Sparkles } from "lucide-react";
import {
  completeOnboardingAction,
  initialOnboardingState,
} from "./actions";

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Ideal para equipos pequeños que empiezan con auditorías automatizadas.",
    price: "Gratis",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Más proyectos, alertas prioritarias y jobs concurrentes.",
    price: "$49/mes",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Multi-tenant avanzado, SSO y soporte dedicado.",
    price: "Contactar",
  },
] as const;

const sourceOptions = [
  {
    id: "github",
    title: "Repositorios GitHub",
    description: "Conecta repos y deja que la IA analice commits y estructura.",
  },
  {
    id: "api",
    title: "Endpoints de API",
    description: "Monitorea latencia, errores y salud de tus servicios.",
  },
  {
    id: "both",
    title: "Ambos",
    description: "Visión unificada de código y APIs en un solo dashboard.",
  },
] as const;

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [organizationName, setOrganizationName] = useState("");
  const [plan, setPlan] = useState<(typeof plans)[number]["id"]>("starter");
  const [initialSource, setInitialSource] =
    useState<(typeof sourceOptions)[number]["id"]>("github");
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    initialOnboardingState
  );

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <Rocket className="h-5 w-5" />
        </span>
        <div>
          <p className="text-base font-semibold text-zinc-900 dark:text-white">
            Configura tu espacio de trabajo
          </p>
          <p className="text-xs text-zinc-400">Paso {step} de 2</p>
        </div>
      </div>

      <div className="mb-8 flex gap-2">
        {[1, 2].map((value) => (
          <div
            key={value}
            className={`h-1.5 flex-1 rounded-full ${
              step >= value ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800"
            }`}
          />
        ))}
      </div>

      {step === 1 ? (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              Nombra tu organización
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Este será el espacio compartido donde tu equipo gestionará proyectos e insights.
            </p>
          </div>

          <div>
            <label
              htmlFor="organizationName"
              className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
            >
              Nombre de la organización
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="organizationName"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Mi Startup Devs"
                className="block w-full rounded-xl border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={organizationName.trim().length < 2}
            onClick={() => setStep(2)}
            className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continuar
          </button>
        </div>
      ) : (
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="organizationName" value={organizationName} />
          <input type="hidden" name="plan" value={plan} />
          <input type="hidden" name="initialSource" value={initialSource} />

          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              Elige tu plan y preferencia inicial
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Puedes cambiar esto más adelante. Empezamos con lo que más te importe monitorear.
            </p>
          </div>

          <div className="grid gap-3">
            {plans.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                  plan === item.id
                    ? "border-indigo-500 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/30"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="planChoice"
                  value={item.id}
                  checked={plan === item.id}
                  onChange={() => setPlan(item.id)}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {item.name}
                    </span>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {item.price}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
                    {item.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
              ¿Qué quieres conectar primero?
            </p>
            <div className="grid gap-3">
              {sourceOptions.map((item) => (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                    initialSource === item.id
                      ? "border-indigo-500 bg-indigo-50/70 dark:border-indigo-400 dark:bg-indigo-950/30"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="sourceChoice"
                    value={item.id}
                    checked={initialSource === item.id}
                    onChange={() => setInitialSource(item.id)}
                    className="mt-1 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-white">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-sm text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {state.error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              {state.error}
            </p>
          ) : null}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Crear espacio y entrar
            </button>
          </div>
        </form>
      )}

      {step === 1 ? (
        <p className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
          <Sparkles className="h-3.5 w-3.5" />
          Podrás invitar a tu equipo desde Settings una vez creada la organización.
        </p>
      ) : null}
    </div>
  );
}
