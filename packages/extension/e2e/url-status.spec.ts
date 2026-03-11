import { test, expect } from "@playwright/test"

/**
 * E2E tests to verify that all search URLs used in default commands
 * across all supported locales are accessible and return HTTP 200.
 *
 * URLs are extracted from packages/extension/src/services/option/defaultSettings.ts.
 * The %s placeholder is replaced with "test" for each request.
 */

type UrlEntry = { title: string; locale: string; searchUrl: string }

// All unique search URLs from DefaultCommands and getDefaultCommands() per locale.
// NOTE: This list must be kept in sync with defaultSettings.ts manually because
// the e2e runtime cannot import defaultSettings.ts directly (it depends on Vite
// build-time variables and the @shared workspace package).
const COMMAND_URLS: UrlEntry[] = [
  // ---- DefaultCommands (en / global fallback) ----
  { title: "Google", locale: "en", searchUrl: "https://google.com/search?q=%s" },
  { title: "Google Image", locale: "en", searchUrl: "https://google.com/search?q=%s&tbm=isch" },
  { title: "Amazon", locale: "en", searchUrl: "https://www.amazon.com/s?k=%s" },
  { title: "Youtube", locale: "en", searchUrl: "https://www.youtube.com/results?search_query=%s" },
  { title: "Netflix", locale: "en", searchUrl: "https://www.netflix.com/search?q=%s" },
  { title: "Pinterest", locale: "en", searchUrl: "https://www.pinterest.com/search/pins/?q=%s" },
  { title: "Drive", locale: "en", searchUrl: "https://drive.google.com/drive/search?q=%s" },
  { title: "en to ja", locale: "en", searchUrl: "https://translate.google.co.jp/?hl=ja&sl=auto&text=%s&op=translate" },

  // ---- ja: Japan ----
  { title: "Yahoo! Japan", locale: "ja", searchUrl: "https://search.yahoo.co.jp/search?p=%s" },
  { title: "Amazon", locale: "ja", searchUrl: "https://www.amazon.co.jp/s?k=%s" },

  // ---- zh: China ----
  { title: "百度", locale: "zh", searchUrl: "https://www.baidu.com/s?wd=%s" },
  { title: "哔哩哔哩", locale: "zh", searchUrl: "https://search.bilibili.com/all?keyword=%s" },
  { title: "京东", locale: "zh", searchUrl: "https://search.jd.com/Search?keyword=%s" },
  { title: "知乎", locale: "zh", searchUrl: "https://www.zhihu.com/search?q=%s" },

  // ---- ko: Korea ----
  { title: "네이버", locale: "ko", searchUrl: "https://search.naver.com/search.naver?query=%s" },
  { title: "쿠팡", locale: "ko", searchUrl: "https://www.coupang.com/np/search?q=%s" },

  // ---- ru: Russia ----
  { title: "Яндекс", locale: "ru", searchUrl: "https://yandex.ru/search/?text=%s" },
  { title: "ВКонтакте", locale: "ru", searchUrl: "https://vk.com/search?c%5Bq%5D=%s" },
  { title: "Ozon", locale: "ru", searchUrl: "https://www.ozon.ru/search/?text=%s" },
  { title: "Wildberries", locale: "ru", searchUrl: "https://www.wildberries.ru/catalog/0/search.aspx?search=%s" },

  // ---- de: Germany ----
  { title: "Amazon", locale: "de", searchUrl: "https://www.amazon.de/s?k=%s" },
  { title: "eBay", locale: "de", searchUrl: "https://www.ebay.de/sch/i.html?_nkw=%s" },

  // ---- fr: France ----
  { title: "Amazon", locale: "fr", searchUrl: "https://www.amazon.fr/s?k=%s" },
  { title: "leboncoin", locale: "fr", searchUrl: "https://www.leboncoin.fr/recherche?text=%s" },

  // ---- es: Spanish ----
  { title: "Amazon", locale: "es", searchUrl: "https://www.amazon.es/s?k=%s" },
  { title: "MercadoLibre", locale: "es", searchUrl: "https://listado.mercadolibre.com/%s" },

  // ---- pt-BR: Brazil ----
  { title: "Amazon", locale: "pt-BR", searchUrl: "https://www.amazon.com.br/s?k=%s" },
  { title: "Mercado Livre", locale: "pt-BR", searchUrl: "https://lista.mercadolivre.com.br/%s" },

  // ---- pt: Portugal ----
  { title: "OLX", locale: "pt", searchUrl: "https://www.olx.pt/ads/?q=%s" },

  // ---- hi: India ----
  { title: "Amazon", locale: "hi", searchUrl: "https://www.amazon.in/s?k=%s" },
  { title: "Flipkart", locale: "hi", searchUrl: "https://www.flipkart.com/search?q=%s" },

  // ---- id: Indonesia ----
  { title: "Tokopedia", locale: "id", searchUrl: "https://www.tokopedia.com/search?st=product&q=%s" },
  { title: "Shopee", locale: "id", searchUrl: "https://shopee.co.id/search?keyword=%s" },

  // ---- ms: Malaysia ----
  { title: "Shopee", locale: "ms", searchUrl: "https://shopee.com.my/search?keyword=%s" },
  { title: "Lazada", locale: "ms", searchUrl: "https://www.lazada.com.my/catalog/?q=%s" },

  // ---- it: Italy ----
  { title: "Amazon", locale: "it", searchUrl: "https://www.amazon.it/s?k=%s" },
]

test.describe("E2E-URL: Default command URLs return HTTP 200", () => {
  for (const { title, locale, searchUrl } of COMMAND_URLS) {
    const url = searchUrl.replace("%s", "test")
    test(`${title} (${locale}): ${url}`, async ({ request }) => {
      const response = await request.get(url, { timeout: 30_000 })
      expect(
        response.status(),
        `Expected HTTP 200 for ${url}, got ${response.status()}`,
      ).toBe(200)
    })
  }
})
