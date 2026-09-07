import { test as setup, expect } from "@playwright/test";

/**
 * Глобальный setup: тестовый пользователь + storageState для всех спеков.
 *
 * Два режима (Фаза 1.5, §4):
 *  · С секретами (SUPABASE_URL + SUPABASE_ANON_KEY + E2E_PASSWORD):
 *    ПРОГРАММНЫЙ вход через supabase.auth.signInWithPassword (стабильнее UI),
 *    сессия инжектится в localStorage браузера до загрузки приложения.
 *  · Без секретов (dev / PR из форка): фолбэк на демо-режим —
 *    регистрация кликами по UI (приложение работает на localStorage).
 *
 * Креды Supabase — только из env (в CI — из секретов репозитория).
 * Для локального демо-режима создаётся одноразовый пароль на запуск.
 */
const email = process.env.E2E_EMAIL ?? "e2e@rhythm.test";
const name = process.env.E2E_NAME ?? "E2E Tester";

const sbUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const sbAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
const configuredPassword = process.env.E2E_PASSWORD;
const demoPassword = `e2e-${crypto.randomUUID()}-Aa1!`;

setup("create test user & save storage state", async ({ page }) => {
  /* ---------- режим Supabase: программный вход ---------- */
  if (sbUrl && sbAnonKey) {
    if (!configuredPassword) {
      throw new Error("E2E_PASSWORD обязателен при запуске E2E через Supabase");
    }

    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(sbUrl, sbAnonKey);

    let session = (await sb.auth.signInWithPassword({ email, password: configuredPassword })).data.session;
    if (!session) {
      /* Пользователя ещё нет — создаём (в проекте должно быть выключено
         подтверждение почты для e2e-аккаунта, см. docs/supabase-activation.md). */
      await sb.auth.signUp({ email, password: configuredPassword, options: { data: { name } } });
      session = (await sb.auth.signInWithPassword({ email, password: configuredPassword })).data.session;
    }
    expect(session, "E2E: не удалось войти в Supabase (проверьте секреты и e2e-пользователя)").toBeTruthy();

    /* supabase-js хранит сессию в localStorage под ключом sb-<ref>-auth-token.
       Инжектим её ДО загрузки приложения — app стартует уже залогиненным. */
    const projectRef = new URL(sbUrl).hostname.split(".")[0];
    const storageKey = `sb-${projectRef}-auth-token`;
    await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
      storageKey,
      JSON.stringify(session),
    ] as [string, string]);

    await page.goto("/");
    await expect(page.getByTestId("nav-journal")).toBeVisible();
    await page.context().storageState({ path: ".auth/user.json" });
    return;
  }

  /* ---------- фолбэк: демо-режим (localStorage), вход через UI ---------- */
  await page.goto("/");

  /* Дожидаемся формы авторизации (приложение грузится из Splash). */
  const signupTab = page.getByTestId("auth-tab-signup");
  await expect(signupTab).toBeVisible();

  await signupTab.click();
  await page.getByTestId("auth-name").fill(name);
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(demoPassword);
  await page.getByTestId("auth-submit").click();

  /* Залогиненный каркас: видна навигация. */
  await expect(page.getByTestId("nav-journal")).toBeVisible();

  await page.context().storageState({ path: ".auth/user.json" });
});
