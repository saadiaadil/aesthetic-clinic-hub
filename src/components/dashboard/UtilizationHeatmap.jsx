import { cn } from '@/utils/cn';
import { dayOfWeek, WEEKDAYS } from '@/utils/date';

function cellTone(value) {
  if (value >= 95) return 'bg-primary text-on-primary font-semibold';
  if (value >= 90) return 'bg-primary-container text-on-primary-container';
  if (value >= 80) return 'bg-secondary-fixed text-on-secondary-fixed';
  if (value >= 65) return 'bg-secondary-fixed/50 text-on-secondary-fixed';
  return 'bg-surface-container-high text-on-surface-variant';
}

/**
 * Stitch "Weekly Suite Capacity & Category Utilization" heatmap.
 * rows: [{ suite, values: number[] }], days: dateKey[] (last is today).
 * Scrolls horizontally on small screens.
 */
export function UtilizationHeatmap({ days, rows }) {
  const lastIndex = days.length - 1;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-2 text-center">
        <caption className="sr-only">Suite utilization by day</caption>
        <thead>
          <tr className="font-label-md text-label-md font-medium text-on-surface-variant">
            <th scope="col" className="text-left">
              Suite / Device
            </th>
            {days.map((key, index) => (
              <th key={key} scope="col" className={cn(index === lastIndex && 'font-bold text-secondary')}>
                {WEEKDAYS[dayOfWeek(key)].slice(0, 3)}
                {index === lastIndex ? ' (Today)' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.suite}>
              <th scope="row" className="max-w-[10rem] truncate text-left font-body-sm text-body-sm font-medium text-on-surface">
                <span className="flex items-center gap-1.5">
                  <span className={cn('size-2 shrink-0 rounded-full', rowIndex % 2 ? 'bg-primary' : 'bg-secondary')} aria-hidden="true" />
                  <span className="truncate">{row.suite}</span>
                </span>
              </th>
              {row.values.map((value, index) => (
                <td key={days[index]} className={cn('h-9 rounded-lg font-label-sm text-label-sm', cellTone(value), index === lastIndex && 'font-bold ring-2 ring-secondary/40')}>
                  {value}%
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
