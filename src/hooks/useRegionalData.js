import { useCallback, useEffect, useState } from "react";
import { loadRegionalData, listRegions } from "../services/regionalService";

/**
 * useRegionalData
 * Loads the regional votes file (skipped when url is falsy) (shared cache) and exposes the region list for the picker.
 *
 * Returns: { regions, loading, error, retry }
 */
export function useRegionalData(url) {
  const [state, setState] = useState({ regions: [], loading: !!url, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!url) {
      setState({ regions: [], loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState(prev => ({ ...prev, loading: true, error: null }));
    loadRegionalData(url)
      .then(data => {
        if (!cancelled) setState({ regions: listRegions(data), loading: false, error: null });
      })
      .catch(error => {
        if (!cancelled) setState({ regions: [], loading: false, error });
      });
    return () => { cancelled = true; };
  }, [url, attempt]);

  const retry = useCallback(() => setAttempt(n => n + 1), []);

  return { ...state, retry };
}
