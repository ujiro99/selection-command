import "chrome"

declare global {
  namespace chrome.declarativeNetRequest {
    interface RuleCondition {
      responseHeaders?: Array<{
        header: string
        values?: string[]
      }>
    }
  }
}
