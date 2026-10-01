import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Filter state stored in the URL (?district=olaya&sort=rating&page=2) so
 * searches are shareable, survive refresh and work with the back button.
 *
 *   const [filters, setFilters, resetFilters] = useQueryState({ q: '', sort: 'recommended', page: '1' });
 *
 * Values equal to their default are removed from the URL. Changing any
 * filter resets `page` unless `page` itself is being set.
 */
export function useQueryState(defaults) {
  const [params, setParams] = useSearchParams();
  const defaultsKey = JSON.stringify(defaults);

  const values = useMemo(() => {
    const parsedDefaults = JSON.parse(defaultsKey);
    return Object.fromEntries(Object.entries(parsedDefaults).map(([key, fallback]) => [key, params.get(key) ?? fallback]));
  }, [params, defaultsKey]);

  const update = useCallback(
    (patch) => {
      const parsedDefaults = JSON.parse(defaultsKey);
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '' || value === parsedDefaults[key]) next.delete(key);
            else next.set(key, String(value));
          });
          if (!('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setParams, defaultsKey],
  );

  const reset = useCallback(() => setParams({}, { replace: true }), [setParams]);

  return [values, update, reset];
}

/** "valet,vipLounge" ⇄ ['valet', 'vipLounge'] */
export const parseList = (value) => (value ? value.split(',').filter(Boolean) : []);
export const toggleInList = (value, item) => {
  const list = parseList(value);
  return (list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]).join(',');
};
