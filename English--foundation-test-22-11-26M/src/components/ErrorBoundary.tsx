import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, Icon } from "./ui";

type Props = { children: ReactNode; onReset?: () => void };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unexpected error in the exam app", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const { onReset } = this.props;
    return (
      <div className="wrap py-10">
        <div className="card mx-auto max-w-md p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-soft text-coral-dark">
            <Icon name="info" className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-black text-ink">Something went wrong</h1>
          <p className="mt-2 text-base font-semibold text-muted">
            An unexpected error stopped the page. If you were taking the exam, your saved answers
            are still on this device.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Button onClick={() => window.location.reload()}>
              <Icon name="refresh" />
              Reload the page
            </Button>
            {onReset && (
              <Button variant="secondary" onClick={onReset}>
                Clear saved data and return to the start
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
