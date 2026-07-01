const fs = require("fs")
const { BetaAnalyticsDataClient } = require("@google-analytics/data")

const propertyId = process.env.GA_PROPERTY_ID
const jsonKey = JSON.parse(process.env.GA_SERVICE_ACCOUNT_KEY)

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: jsonKey,
})

async function listAvailableDimensions() {
  const [metadata] = await analyticsDataClient.getMetadata({
    name: `properties/${propertyId}/metadata`,
  })
  const customDims = metadata.dimensions
    .filter((d) => d.apiName.startsWith("customEvent:"))
    .map((d) => d.apiName)
  console.log("Available customEvent dimensions:", customDims)
  return customDims
}

async function runReport() {
  await listAvailableDimensions()

  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      {
        startDate: "2024-12-10",
        endDate: "today",
      },
    ],
    metrics: [
      {
        name: "eventCount",
      },
    ],
    dimensions: [
      {
        name: "customEvent:event_label",
      },
      {
        name: "customEvent:command_id",
      },
      {
        name: "customEvent:source_type",
      },
      {
        name: "customEvent:source_id",
      },
    ],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: {
          value: "selection_command",
          matchType: "EXACT",
        },
      },
    },
  })

  const data = response.rows.map((row) => ({
    openMode: row.dimensionValues[0].value,
    commandId: row.dimensionValues[1].value,
    sourceType: row.dimensionValues[2].value,
    sourceId: row.dimensionValues[3].value,
    eventCount: parseInt(row.metricValues[0].value),
  }))

  const byOpenMode = data.reduce((acc, row) => {
    const key = row.openMode
    acc[key] = (acc[key] || 0) + row.eventCount
    return acc
  }, {})

  const byCommandId = data.reduce((acc, row) => {
    const existing = acc.find((a) => a.commandId === row.commandId)
    if (existing) {
      existing.eventCount += row.eventCount
    } else {
      acc.push({ commandId: row.commandId, eventCount: row.eventCount })
    }
    return acc
  }, [])

  const bySourceType = data.reduce((acc, row) => {
    const key = row.sourceType
    acc[key] = (acc[key] || 0) + row.eventCount
    return acc
  }, {})

  const result = {
    byOpenMode,
    byCommandId: byCommandId.sort((a, b) => b.eventCount - a.eventCount),
    bySourceType,
    total: data.reduce((sum, row) => sum + row.eventCount, 0),
    updated: Date.now(),
  }

  fs.writeFileSync(
    "./ga-selection-command-analytics.json",
    JSON.stringify(result, null, 2),
  )

  console.log(`Total events: ${result.total}`)
  console.log("By open mode:", byOpenMode)
  console.log("By source type:", bySourceType)
}

runReport().catch(console.error)
