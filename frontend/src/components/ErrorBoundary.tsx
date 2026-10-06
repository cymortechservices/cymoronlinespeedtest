import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-full grid place-items-center p-6 text-center">
        <div className="glass rounded-3xl p-8 max-w-md">
          <h1 className="text-2xl font-extrabold">Something broke on this page</h1>
          <p className="mt-3 text-mist">Reload to start again. Your connection is not affected.</p>
          <button onClick={() => location.reload()} className="mt-6 sheen text-ink font-semibold rounded-full px-6 py-3">Reload</button>
        </div>
      </main>
    );
  }
}
