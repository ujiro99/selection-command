import type { BrowserContext } from "@playwright/test"

const BYPASS_TOKEN = process.env.E2E_TURNSTILE_BYPASS_SECRET

/**
 * Cloudflare Turnstile のスクリプトをモックし、E2Eテスト中のログインを
 * ブロックされずに通過させます。
 * ステージング環境（siro-cola.workers.dev）でのみ使用してください。
 */
export async function mockTurnstile(context: BrowserContext): Promise<void> {
  if (!BYPASS_TOKEN) {
    throw new Error(
      "E2E_TURNSTILE_BYPASS_SECRET is not set. " +
        "Contact the Hub maintainer to get the staging bypass secret.",
    )
  }
  await context.route("**/challenges.cloudflare.com/turnstile/**", (route) => {
    route.fulfill({
      contentType: "application/javascript",
      body: `
        window.turnstile = {
          render: function(container, params) {
            setTimeout(function() {
              if (params && typeof params.callback === 'function') {
                params.callback(${JSON.stringify(BYPASS_TOKEN)});
              }
            }, 50);
            return 'e2e-mock-widget';
          },
          reset: function() {},
          remove: function() {},
          getResponse: function() { return ${JSON.stringify(BYPASS_TOKEN)}; }
        };
      `,
    })
  })
}
