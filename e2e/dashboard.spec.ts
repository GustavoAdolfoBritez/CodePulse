import { test, expect } from "@playwright/test";

test("redirects the home page to the dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("dashboard shows the key stat cards and performance chart", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByText("Overview")).toBeVisible();
  await expect(page.getByText("Proyectos activos")).toBeVisible();
  await expect(page.getByText("Rendimiento de la API")).toBeVisible();
});
