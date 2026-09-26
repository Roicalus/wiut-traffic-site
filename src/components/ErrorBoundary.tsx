import { Component, type ReactNode } from "react";

/**
 * Keeps one broken block (bad data file, stale cache after a deploy) from blanking the whole site:
 * renders `fallback` instead, and resets when `resetKey` changes (e.g. on navigation).
 */
export default class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode; resetKey?: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[site] a section failed to render:", error);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      this.props.fallback ?? (
        <div role="alert" className="card p-6 text-ink-2">
          This section could not be displayed. Reloading the page usually fixes it (a new version of the site may have just been published).
          <button type="button" onClick={() => location.reload()} className="btn btn-ghost btn-sm ml-3">Reload</button>
        </div>
      )
    );
  }
}
