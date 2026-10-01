import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { Switch } from '@/components/common/Form';
import { Modal } from '@/components/common/Overlay';
import { FormAlert } from '@/components/common/States';
import { minutesToSlot, WEEKDAYS } from '@/utils/date';
import { formatSlot } from '@/utils/format';

const TIMES = Array.from({ length: 31 }, (_, index) => minutesToSlot(8 * 60 + index * 30)); // 08:00 → 23:00
const selectClass =
  'rounded-lg bg-surface-container-low px-2.5 py-2 font-body-sm text-body-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40';

/** Weekly availability editor for one specialist (doctor_schedule rows). */
export function ScheduleEditorModal({ doctor, blocks, isOpen, onClose, onSave }) {
  const [days, setDays] = useState(() =>
    WEEKDAYS.map((_, dayOfWeek) => {
      const block = blocks.find((item) => item.dayOfWeek === dayOfWeek);
      return { dayOfWeek, working: Boolean(block), start: block?.start ?? '10:00', end: block?.end ?? '18:00' };
    }),
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (dayOfWeek, patch) => setDays((current) => current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)));

  const save = async () => {
    const working = days.filter((day) => day.working);
    if (working.length === 0) return setError('Select at least one working day.');
    const invalid = working.find((day) => day.end <= day.start);
    if (invalid) return setError(`${WEEKDAYS[invalid.dayOfWeek]}: the end time must be after the start time.`);
    setError('');
    setSaving(true);
    try {
      await onSave(working.map(({ dayOfWeek, start, end }) => ({ dayOfWeek, start, end })));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`Weekly availability — ${doctor.name}`}
      description="Riyadh time. Existing bookings are kept; new slots follow these hours."
      footer={
        <>
          <Button variant="soft" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save availability
          </Button>
        </>
      }
    >
      <div className="space-y-space-sm">
        <FormAlert>{error}</FormAlert>
        {days.map((day) => (
          <div key={day.dayOfWeek} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3">
            <div className="flex min-w-[9rem] items-center gap-3">
              <Switch srLabel={`${WEEKDAYS[day.dayOfWeek]} working`} checked={day.working} onChange={(event) => update(day.dayOfWeek, { working: event.target.checked })} />
              <span className="font-title-md text-title-md text-on-surface">{WEEKDAYS[day.dayOfWeek]}</span>
            </div>
            {day.working ? (
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`start-${day.dayOfWeek}`}>
                  {WEEKDAYS[day.dayOfWeek]} start
                </label>
                <select id={`start-${day.dayOfWeek}`} value={day.start} onChange={(event) => update(day.dayOfWeek, { start: event.target.value })} className={selectClass}>
                  {TIMES.map((time) => (
                    <option key={time} value={time}>
                      {formatSlot(time)}
                    </option>
                  ))}
                </select>
                <span className="text-on-surface-variant">–</span>
                <label className="sr-only" htmlFor={`end-${day.dayOfWeek}`}>
                  {WEEKDAYS[day.dayOfWeek]} end
                </label>
                <select id={`end-${day.dayOfWeek}`} value={day.end} onChange={(event) => update(day.dayOfWeek, { end: event.target.value })} className={selectClass}>
                  {TIMES.map((time) => (
                    <option key={time} value={time}>
                      {formatSlot(time)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="font-label-md text-label-md text-on-surface-variant">Day off</span>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
