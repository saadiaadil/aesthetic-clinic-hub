import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatest } from './useLatest';

/**
 * Runs an async service call and tracks { data, error, status }.
 *
 *   const { data, isLoading, error, reload } = useAsync(() => getClinicById(id), [id]);
 *
 * - Re-runs when `deps` change; ignores responses from stale calls.
 * - `keepPreviousData` keeps the last result visible while refetching
 *   (paginated lists and filters, so the grid does not flash).
 * - `setData` applies optimistic updates after mutations.
 */
export function useAsync(asyncFn, deps = [], { immediate = true, keepPreviousData = false } = {}) {
  const [state, setState] = useState({ data: undefined, error: null, status: immediate ? 'loading' : 'idle' });
  const callId = useRef(0);
  const fnRef = useLatest(asyncFn);

  const run = useCallback(async () => {
    callId.current += 1;
    const id = callId.current;
    setState((prev) => ({ data: keepPreviousData ? prev.data : undefined, error: null, status: 'loading' }));
    try {
      const data = await fnRef.current();
      if (id === callId.current) setState({ data, error: null, status: 'success' });
      return data;
    } catch (error) {
      if (id === callId.current) setState((prev) => ({ data: keepPreviousData ? prev.data : undefined, error, status: 'error' }));
      return undefined;
    }
  }, [fnRef, keepPreviousData]);

  const depsKey = JSON.stringify(deps);
  useEffect(() => {
    // `deps` are serialised so callers can pass inline arrays/objects safely.
    if (immediate) run();
  }, [run, immediate, depsKey]);

  const setData = useCallback((updater) => {
    setState((prev) => ({ ...prev, data: typeof updater === 'function' ? updater(prev.data) : updater }));
  }, []);

  return {
    ...state,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    reload: run,
    setData,
  };
}
