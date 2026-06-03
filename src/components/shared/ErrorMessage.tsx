import { AlertCircle } from 'lucide-react'

interface ErrorMessageProps {
  message?: string
  onRetry?: () => void
}

export function ErrorMessage({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-destructive/70" />
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
        >
          Try again
        </button>
      )}
    </div>
  )
}
