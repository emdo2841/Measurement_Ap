import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled application error', {
      error,
      componentStack: errorInfo.componentStack,
    })
  }

  private reloadPage = () => {
    window.location.reload()
  }

  private returnHome = () => {
    const isAuthenticated = Boolean(
      localStorage.getItem('accessToken'),
    )

    window.location.assign(
      isAuthenticated ? '/dashboard' : '/',
    )
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f2ec] px-4 py-10">
        <section
          className="w-full max-w-lg rounded-3xl border border-white/80 bg-white/90 p-8 text-center shadow-[0_22px_55px_rgba(45,58,55,0.1)]"
          role="alert"
          aria-live="assertive"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl font-black text-red-700">
            !
          </div>

          <h1 className="mt-5 font-display text-3xl text-[#263d47]">
            Something went wrong
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#66736d]">
            EJ TailorPro encountered an unexpected problem. Your saved
            information has not been deleted.
          </p>

          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-5 max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-red-50 p-4 text-left text-xs text-red-700">
              {this.state.error.message}
            </pre>
          )}

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={this.reloadPage}
              className="rounded-xl bg-[#263d47] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#36515b]"
            >
              Reload page
            </button>

            <button
              type="button"
              onClick={this.returnHome}
              className="rounded-xl border border-[#cbd5d0] bg-white px-5 py-3 text-sm font-bold text-[#49675a] transition hover:bg-[#edf2ef]"
            >
              Return home
            </button>
          </div>
        </section>
      </main>
    )
  }
}
