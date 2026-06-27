export async function fetchCfAuthToken(
  url: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "CF-Access-Client-Id": clientId,
        "CF-Access-Client-Secret": clientSecret,
      },
    })
    const cfCookie = res.headers
      .getSetCookie()
      .map((c) => c.split(";")[0].trim())
      .find((c) => c.startsWith("CF_Authorization="))
    return cfCookie ? cfCookie.split("=").slice(1).join("=") : null
  } catch {
    return null
  }
}
