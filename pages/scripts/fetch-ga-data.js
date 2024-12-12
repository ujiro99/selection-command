const fs = require('fs')
const { BetaAnalyticsDataClient } = require('@google-analytics/data')

// const propertyId = process.env.GA_PROPERTY_ID
const propertyId = '469672228'
// const jsonKey = JSON.parse(process.env.GA_SERVICE_ACCOUNT_KEY)
const jsonKey = require('./selection-command-b1db66b80a01.json')

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: jsonKey,
})

async function runReport() {
  const [response] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
    metrics: [{ name: 'eventCount' }],
    dimensions: [{ name: 'eventName' }],
  })

  const data = response.rows.reduce((acc, row) => {
    acc[row.dimensionValues[0].value] = parseInt(row.metricValues[0].value)
    return acc
  }, {})

  fs.writeFileSync('analytics.json', JSON.stringify(data, null, 2))
}

runReport().catch(console.error)
