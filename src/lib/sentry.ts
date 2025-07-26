import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  Scope,
} from "@sentry/browser"

// filter integrations that use the global variable
const integrations = getDefaultIntegrations({}).filter((defaultIntegration) => {
  return !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
    defaultIntegration.name,
  )
})

const client = new BrowserClient({
  dsn: "https://c3ef72fd0c92de0910f8467e466323a8@o4509693053698048.ingest.us.sentry.io/4509693069361153",
  transport: makeFetchTransport,
  stackParser: defaultStackParser,
  integrations: integrations,
})

const scope = new Scope()
scope.setClient(client)

client.init() // initializing has to be done after setting the client on the scope
console.log("Sentry initialized")

export const Sentry = scope
