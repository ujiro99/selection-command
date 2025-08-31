import { useEffect, useState, useMemo, useRef } from "react"
import {
  Ban,
  Check,
  CircleDashed,
  CircleAlert,
  LoaderCircle,
  X,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tooltip } from "@/components/Tooltip"
import { TypeIcon } from "@/components/pageAction/TypeIcon"
import { usePageActionRunner } from "@/hooks/pageAction/usePageActionRunner"
import { usePageActionContext } from "@/hooks/pageAction/usePageActionContext"
import type { PageActiontResult } from "@/types"
import { PAGE_ACTION_EXEC_STATE as EXEC_STATE } from "@/const"
import { cn, isEmpty } from "@/lib/utils"

export function PageActionRunner(): JSX.Element {
  usePageActionRunner()
  const { status } = usePageActionContext()
  const [results, setResults] = useState<PageActiontResult[]>()
  const [progress, setProgress] = useState(0)
  const startTimeRef = useRef<number>(0)
  const progressTORef = useRef<number>()

  const visible = results && results.length > 0

  const hasError = useMemo((): boolean => {
    if (results == null) return false
    return results.some((r) => r.status === EXEC_STATE.Failed)
  }, [results])

  useEffect(() => {
    if (status == null) return
    if (status.results.length === 0) return
    // Start of execution.
    setResults(status.results)
  }, [status])

  useEffect(() => {
    if (status == null) return

    setProgress(0)
    clearTimeout(progressTORef.current)

    // Don't show progress if there's an error.
    if (hasError) return

    startTimeRef.current = Date.now()
    const result = status.results.find(
      (r: PageActiontResult) => r.stepId === status.stepId,
    )
    const duration = result?.duration ?? 1
    progressTORef.current = window.setInterval(() => {
      const prgrs = ((Date.now() - startTimeRef.current) / duration) * 100
      if (prgrs >= 100) {
        // Execution finished.
        clearTimeout(progressTORef.current)
        setResults([])
        return
      }
      setProgress(prgrs)
    }, 50)
  }, [status, hasError])

  return (
    <div
      className={cn(
        "relative fixed z-[2147483647] top-2 right-2 pointer-events-none",
        "backdrop-blur bg-gray-100/60 rounded-md shadow-md transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="overflow-hidden rounded-md h-[12px] -mb-[12px]">
        <Progress
          value={progress}
          className={cn(
            "h-0.5 bg-transparent opacity-0",
            progress > 10 && "opacity-100",
          )}
        />
      </div>
      {hasError && (
        <button
          className="absolute right-1 top-1.5 pointer-events-auto bg-white/80 rounded-full p-1"
          onClick={() => setResults([])}
        >
          <X size={12} className="stroke-gray-500" />
        </button>
      )}
      <ul className="text-xs text-gray-600 p-2 pt-1.5">
        {results?.map((result) => (
          <Step key={result.stepId} result={result} />
        ))}
      </ul>
    </div>
  )
}

const Step = ({ result }: { result: PageActiontResult }) => {
  const stepRef = useRef<HTMLLIElement>(null)
  const hasMessage = !isEmpty(result.message)
  return (
    <li
      ref={stepRef}
      className={cn(
        "flex items-center gap-1.5 p-1 min-w-28",
        hasMessage && "cursor-help pointer-events-auto text-red-500",
      )}
    >
      <StatusIcon status={result.status} />
      <TypeIcon
        type={result.type}
        className={cn(hasMessage ? "stroke-red-500" : "stroke-gray-500")}
      />
      <span className="font-mono max-w-40 truncate">{result.label}</span>
      {hasMessage && (
        <Tooltip
          positionElm={stepRef.current}
          text={result.message ?? ""}
          className="max-w-64"
        />
      )}
    </li>
  )
}

const StatusIcon = ({
  status,
  className,
}: {
  status: EXEC_STATE
  className?: string
}) => {
  const size = 14
  switch (status) {
    case EXEC_STATE.Queue:
      return <CircleDashed size={size} className={cn(className)} />
    case EXEC_STATE.Start:
    case EXEC_STATE.Doing:
      return (
        <LoaderCircle size={size} className={cn("animate-spin", className)} />
      )
    case EXEC_STATE.Done:
      return <Check size={size} className={cn(className)} />
    case EXEC_STATE.Failed:
      return (
        <CircleAlert size={size} className={cn("stroke-red-500", className)} />
      )
    case EXEC_STATE.Stop:
      return <Ban size={size} className={cn(className)} />
    default:
      return null
  }
}
