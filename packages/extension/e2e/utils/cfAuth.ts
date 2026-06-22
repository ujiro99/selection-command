import https from "node:https"

export async function fetchCfAuthToken(
  url: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.request(
      url,
      {
        headers: {
          "CF-Access-Client-Id": clientId,
          "CF-Access-Client-Secret": clientSecret,
        },
      },
      (res) => {
        const rawCookies = res.headers["set-cookie"] ?? []
        const arr = Array.isArray(rawCookies) ? rawCookies : [rawCookies]
        const cfCookie = arr
          .map((c) => c.split(";")[0].trim())
          .find((c) => c.startsWith("CF_Authorization="))
        if (cfCookie) {
          resolve(cfCookie.split("=").slice(1).join("="))
          res.resume()
          return
        }
        const cfHeader = res.headers["cf-access-token"]
        resolve(typeof cfHeader === "string" ? cfHeader : null)
        res.resume()
      },
    )
    req.on("error", () => resolve(null))
    req.end()
  })
}
