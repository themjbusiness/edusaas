import { useCallback, useEffect, useState } from 'react';
import type { ApiError } from './api';

/** Load data for a screen: { data, error, reload }. Stale responses from an earlier load are ignored. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [n, setN] = useState(0);
  const reload = useCallback(() => setN((x) => x + 1), []);
  useEffect(() => {
    let live = true;
    setError(null);
    fn().then((d) => { if (live) setData(d); }, (e) => { if (live) setError(e); });
    return () => { live = false; };
  }, [n, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, error, reload, setData };
}
