import React from "react";
import { useTranslate } from "@tolgee/react";
import debug from "../utils/debug";
import "./ErrorBoundary.css";

function DefaultFallback({ onRetry }) {
  const { t } = useTranslate();
  return (
    <div className="error-boundary-fallback" role="alert">
      <h2>{t("errors.boundary.title", "Algo salió mal")}</h2>
      <p>{t("errors.boundary.description", "Ocurrió un error inesperado. Tus respuestas no se pierden al reintentar.")}</p>
      <button onClick={onRetry}>
        {t("errors.boundary.retry", "Reintentar")}
      </button>
    </div>
  );
}

/**
 * Catches render errors in its subtree and shows a recovery UI instead of a white screen.
 *
 * Props:
 * - fallback: optional ({ error, retry }) => JSX to replace the default fallback
 * - onRetry: optional callback run when the user retries (after the error state is cleared)
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    debug.error("Uncaught render error:", error, info?.componentStack);
  }

  handleRetry() {
    this.setState({ error: null });
    if (this.props.onRetry) this.props.onRetry();
  }

  render() {
    if (!this.state.error) return this.props.children;

    if (typeof this.props.fallback === "function") {
      return this.props.fallback({ error: this.state.error, retry: this.handleRetry });
    }

    return <DefaultFallback onRetry={this.handleRetry} />;
  }
}
