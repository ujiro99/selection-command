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
      orGroup: {
        expressions: [
          {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          value: 'command_hub_add',
          matchType: 'EXACT',
        },
      },
    },
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: {
                value: 'command_hub_star_add',
                matchType: 'EXACT',
              },
            },
          },
          {
            filter: {
              fieldName: 'eventName',
              stringFilter: {
                value: 'command_hub_star_remove',
                matchType: 'EXACT',
              },
            },
          },
        ],
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

  const groupped = data.reduce(
    (acc, row) => {
      switch (row.eventName) {
        case 'command_hub_add':
          acc.download.push({
            eventId: row.eventId,
            eventCount: row.eventCount,
          })
          break
        case 'command_hub_star_add':
          const r = acc.starred.find((a) => a.eventId === row.eventId) ?? {
            eventId: row.eventId,
            eventCount: 0,
          }
          r.eventCount += row.eventCount
          acc.starred = acc.starred.filter((a) => a.eventId !== row.eventId)
          acc.starred.push(r)
          break
        case 'command_hub_star_remove':
          const r2 = acc.starred.find((a) => a.eventId === row.eventId) ?? {
            eventId: row.eventId,
            eventCount: 0,
          }
          r2.eventCount -= row.eventCount
          acc.starred = acc.starred.filter((a) => a.eventId !== row.eventId)
          acc.starred.push(r2)
          break
      }
      return acc
    },
    { download: [], starred: [], updated: Date.now() },
  )

  fs.writeFileSync(
    './src/data/analytics.json',
    JSON.stringify(groupped, null, 2),
  )
}

runReport().catch(console.error)
