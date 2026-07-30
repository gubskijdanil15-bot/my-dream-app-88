import React from "react";

export function SafeBoundary({ name, fallback, children }: { name: string; fallback?: React.ReactNode; children: React.ReactNode }) {
  return (
    <ErrorBoundary name={name} fallback={fallback}>{children}</ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<{ name: string; fallback?: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { name: string; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // Log and continue. In real life, send to Sentry etc.
    console.error(`[SafeBoundary:${this.props.name}]`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div role="alert" className="m-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <div className="font-semibold text-foreground">Section failed to load</div>
          <div className="mt-1">Something in вЂњ{this.props.name}вЂќ crashed. The rest of the page is still available.</div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
