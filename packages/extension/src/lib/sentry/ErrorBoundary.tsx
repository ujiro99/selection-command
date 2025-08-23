import React from "react"
import { Sentry } from "@/lib/sentry"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ message: string }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

const DefaultFallback = ({ message }: { message: string }) => (
  <div>
    <p>{message}</p>
  </div>
)

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error): void {
    console.log("ErrorBoundary caught an error:", error)
    Sentry.captureException(error)
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || DefaultFallback
      return <Fallback message={this.state.error.message} />
    }

    return this.props.children
  }
}
