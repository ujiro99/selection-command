const fs = require('fs')
const { BetaAnalyticsDataClient } = require('@google-analytics/data')

const propertyId = process.env.GA_PROPERTY_ID
const jsonKey = JSON.parse(process.env.GA_SERVICE_ACCOUNT_KEY)

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: jsonKey,
})

async function runReport() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      {
        startDate: '2024-12-10',
        endDate: 'today',
      },
    ],
    metrics: [
      {
        name: 'eventCount',
      },
    ],
    dimensions: [
      {
        name: 'eventName',
      },
      {
        name: 'customEvent:id',
      },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          value: 'command_hub_add',
          matchType: 'EXACT',
        },
      },
    },
  })

  const data = response.rows.reduce((acc, row) => {
    const obj = {
      eventName: row.dimensionValues[0].value,
      eventId: row.dimensionValues[1].value,
      eventCount: parseInt(row.metricValues[0].value),
    }
    acc.push(obj)
    return acc
  }, [])

  fs.writeFileSync('./src/data/analytics.json', JSON.stringify(data, null, 2))
}

runReport().catch(console.error)
