/**
 * @author Taha Al-Jody <taha@ta3design.com>
 * https://github.com/TA3/web-user-behaviour
 */

type UserConfig = {
  userInfo?: boolean
  clicks?: boolean
  mouseMovement?: boolean
  mouseMovementInterval?: number
  mouseScroll?: boolean
  mousePageChange?: boolean // todo
  timeCount?: boolean
  clearAfterProcess?: boolean // todo
  processTime?: number | false
  windowResize?: boolean
  visibilitychange?: boolean
  processData: (results: Results) => void
}

type EventsFunctions = {
  scroll: () => void
  click: (e: MouseEvent) => void
  mouseMovement: (e: MouseEvent) => void
  windowResize: (e: UIEvent) => void
  visibilitychange: (e: Event) => void
}

type Memory = {
  processInterval: ReturnType<typeof setInterval> | null
  mouseInterval: ReturnType<typeof setInterval> | null
  mousePosition: [number, number, number] | []
  eventsFunctions: EventsFunctions
}

type Results = {
  userInfo?: {
    windowSize: [number, number]
    appCodeName: string
    appName: string
    vendor: string
    platform: string
    userAgent: string
  }
  time?: {
    startTime: number
    currentTime: number
    stopTime?: number
  }
  clicks?: {
    clickCount: number
    clickDetails: Array<[number, number, string, number]>
  }
  mouseMovements?: Array<[number, number, number]>
  mouseScroll?: Array<[number, number, number]>
  contextChange?: any[] // todo
  windowSizes?: Array<[number, number, number]>
  visibilitychanges?: Array<[string, number]>
}

const isNumber = (n: any): n is number => typeof n === 'number'

export const UserBehaviour = (() => {
  const defaults: Required<UserConfig> = {
    userInfo: true,
    clicks: true,
    mouseMovement: true,
    mouseMovementInterval: 1,
    mouseScroll: true,
    mousePageChange: true,
    timeCount: true,
    clearAfterProcess: true,
    processTime: 15,
    windowResize: true,
    visibilitychange: true,
    processData(results) {
      console.log(results)
    },
  }

  let user_config = {} as UserConfig

  const mem: Memory = {
    processInterval: null,
    mouseInterval: null,
    mousePosition: [],
    eventsFunctions: {
      scroll() {
        results.mouseScroll?.push([
          window.scrollX,
          window.scrollY,
          getTimeStamp(),
        ])
      },
      click(e) {
        results.clicks!.clickCount++
        const path = e
          .composedPath()
          .slice(0, -2)
          .map((el) => {
            if (el instanceof HTMLElement) {
              let node = el.localName || ''
              if (el.className)
                el.classList.forEach((clE) => (node += `.${clE}`))
              if (el.id) node += `#${el.id}`
              return node
            }
            return ''
          })
          .reverse()
          .join('>')
        results.clicks!.clickDetails.push([
          e.clientX,
          e.clientY,
          path,
          getTimeStamp(),
        ])
      },
      mouseMovement(e) {
        mem.mousePosition = [e.clientX, e.clientY, getTimeStamp()]
      },
      windowResize() {
        results.windowSizes?.push([
          window.innerWidth,
          window.innerHeight,
          getTimeStamp(),
        ])
      },
      visibilitychange() {
        results.visibilitychanges?.push([
          document.visibilityState,
          getTimeStamp(),
        ])
        processResults()
      },
    },
  }

  let results = {} as Results

  function resetResults(): void {
    results = {
      userInfo:
        user_config.userInfo !== false
          ? {
            windowSize: [window.innerWidth, window.innerHeight],
            appCodeName: navigator.appCodeName || '',
            appName: navigator.appName || '',
            vendor: navigator.vendor || '',
            platform: navigator.platform || '',
            userAgent: navigator.userAgent || '',
          }
          : undefined,
      time:
        user_config.timeCount !== false
          ? { startTime: getTimeStamp(), currentTime: getTimeStamp() }
          : undefined,
      clicks:
        user_config.clicks !== false
          ? { clickCount: 0, clickDetails: [] }
          : undefined,
      mouseMovements: user_config.mouseMovement !== false ? [] : undefined,
      mouseScroll: user_config.mouseScroll !== false ? [] : undefined,
      contextChange: user_config.mousePageChange !== false ? [] : undefined,
      windowSizes: user_config.windowResize !== false ? [] : undefined,
      visibilitychanges:
        user_config.visibilitychange !== false ? [] : undefined,
    }
  }

  resetResults()

  function getTimeStamp(): number {
    return Date.now()
  }

  function config(ob?: Partial<UserConfig>): void {
    user_config = { ...defaults, ...(ob || {}) }
  }

  function start(): void {
    if (!user_config.timeCount && results.time)
      results.time.startTime = getTimeStamp()

    if (user_config.mouseMovement) {
      window.addEventListener('mousemove', mem.eventsFunctions.mouseMovement)
      if (user_config.mouseMovementInterval) {
        mem.mouseInterval = setInterval(() => {
          if (
            mem.mousePosition.length &&
            (!results.mouseMovements!.length ||
              (mem.mousePosition[0] !==
                results.mouseMovements![
                results.mouseMovements!.length - 1
                ][0] &&
                mem.mousePosition[1] !==
                results.mouseMovements![
                results.mouseMovements!.length - 1
                ][1]))
          ) {
            results.mouseMovements!.push(
              mem.mousePosition as [number, number, number],
            )
          }
        }, user_config.mouseMovementInterval * 1000)
      }
    }

    if (user_config.clicks) {
      window.addEventListener('click', mem.eventsFunctions.click)
    }

    if (user_config.mouseScroll) {
      window.addEventListener('scroll', mem.eventsFunctions.scroll)
    }

    if (user_config.windowResize) {
      window.addEventListener('resize', mem.eventsFunctions.windowResize)
    }

    if (user_config.visibilitychange) {
      window.addEventListener(
        'visibilitychange',
        mem.eventsFunctions.visibilitychange,
      )
    }

    if (isNumber(user_config.processTime)) {
      mem.processInterval = setInterval(
        () => processResults(),
        user_config.processTime * 1000,
      )
    }
  }

  function processResults(): void {
    user_config.processData(results)
    if (user_config.clearAfterProcess) resetResults()
  }

  function stop(): void {
    if (mem.processInterval) clearInterval(mem.processInterval)
    if (mem.mouseInterval) clearInterval(mem.mouseInterval)

    window.removeEventListener('mousemove', mem.eventsFunctions.mouseMovement)
    window.removeEventListener('click', mem.eventsFunctions.click)
    window.removeEventListener('scroll', mem.eventsFunctions.scroll)
    window.removeEventListener('resize', mem.eventsFunctions.windowResize)
    window.removeEventListener(
      'visibilitychange',
      mem.eventsFunctions.visibilitychange,
    )

    if (results.time) results.time.stopTime = getTimeStamp()
    processResults()
  }

  function result(): Results {
    if (!user_config.userInfo && results.userInfo) delete results.userInfo
    if (user_config.timeCount && results.time)
      results.time.currentTime = getTimeStamp()

    return results
  }

  function showConfig(): UserConfig {
    return Object.keys(user_config).length === Object.keys(defaults).length
      ? user_config
      : defaults
  }

  return { showConfig, config, start, stop, showResult: result, processResults }
})()
