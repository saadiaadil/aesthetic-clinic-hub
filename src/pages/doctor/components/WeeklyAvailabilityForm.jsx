import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCcw, Save } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Field, SelectInput, Switch } from '@/components/common/Form';
import { FormAlert } from '@/components/common/States';
import { useToast } from '@/hooks/useToast';
import { updateDoctorSchedule } from '@/services/doctorService';
import { cn } from '@/utils/cn';
import { minutesToSlot, slotToMinutes, WEEKDAYS } from '@/utils/date';
import { formatSlot } from '@/utils/format';

/** 30-minute steps from 08:00 to 23:00 (Riyadh time). */
const TIME_OPTIONS = Array.from({ length: 31 }, (_, index) => minutesToSlot(8 * 60 + index * 30));
const DEFAULT_HOURS = { start: '10:00', end: '18:00' };
const FRIDAY = 5;

const daySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    working: z.boolean(),
    start: z.string(),
    end: z.string(),
  })
  .refine((day) => !day.working || day.end > day.start, { path: ['end'], message: 'End time must be after the start time.' });

const schema = z.object({
  days: z
    .array(daySchema)
    .length(7)
    .refine((days) => days.some((day) => day.working), { message: 'Choose at least one working day so patients can book you.' }),
});

/** Stored blocks → one row per weekday, Sunday first (the Riyadh working week). */
function toWeekRows(blocks = []) {
  return WEEKDAYS.map((_, dayOfWeek) => {
    const block = blocks.find((item) => item.dayOfWeek === dayOfWeek);
    return { dayOfWeek, working: Boolean(block), start: block?.start ?? DEFAULT_HOURS.start, end: block?.end ?? DEFAULT_HOURS.end };
  });
}

const toBlocks = (days) => days.filter((day) => day.working).map(({ dayOfWeek, start, end }) => ({ dayOfWeek, start, end }));

const hoursBetween = (start, end) => Math.max(0, (slotToMinutes(end) - slotToMinutes(start)) / 60);
const formatHours = (hours) => `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`;

function TimeSelect(props) {
  return (
    <SelectInput {...props}>
      {TIME_OPTIONS.map((slot) => (
        <option key={slot} value={slot}>
          {formatSlot(slot)}
        </option>
      ))}
    </SelectInput>
  );
}

function DayRow({ index, day, register, error }) {
  const name = WEEKDAYS[day.dayOfWeek];
  const hours = hoursBetween(day.start, day.end);
  const offLabel = day.dayOfWeek === FRIDAY ? 'Day off • Jumu’ah' : 'Day off';
  return (
    <li
      className={cn(
        'flex flex-col gap-space-sm rounded-xl p-space-sm transition-colors sm:p-space-md lg:flex-row lg:items-start lg:justify-between',
        day.working ? 'bg-surface-container-low' : 'bg-surface-container-low/50',
      )}
    >
      <div className="flex items-center justify-between gap-space-md lg:w-60 lg:pt-6">
        <div className="min-w-0">
          <p className={cn('font-title-md text-title-md', day.working ? 'text-on-surface' : 'text-on-surface-variant')}>{name}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{day.working ? (hours > 0 ? formatHours(hours) : 'Check the hours') : offLabel}</p>
        </div>
        <Switch label="Working" srLabel={`Working on ${name}`} {...register(`days.${index}.working`, { deps: [`days.${index}.end`] })} />
      </div>
      {day.working ? (
        <div className="grid grid-cols-2 gap-space-sm lg:w-[22rem]">
          <Field label="From">
            <TimeSelect {...register(`days.${index}.start`, { deps: [`days.${index}.end`] })} />
          </Field>
          <Field label="Until" error={error}>
            <TimeSelect {...register(`days.${index}.end`)} />
          </Field>
        </div>
      ) : (
        <p className="rounded-lg bg-surface-container px-4 py-3 font-body-sm text-body-sm text-on-surface-variant lg:mt-6 lg:w-[22rem]">
          Not accepting bookings on {name}s
        </p>
      )}
    </li>
  );
}

/**
 * Weekly availability editor (doctor_schedule): one row per weekday with a
 * working switch and 30-minute start / end times, validated with Zod.
 */
export function WeeklyAvailabilityForm({ doctorId, clinicId, blocks, onSaved }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { days: toWeekRows(blocks) } });
  const days = useWatch({ control, name: 'days' });

  const workingDays = days.filter((day) => day.working);
  const weeklyHours = workingDays.reduce((sum, day) => sum + hoursBetween(day.start, day.end), 0);
  // The array-level error only refreshes on submit, so hide it as soon as a day is switched on.
  const noWorkingDayError = workingDays.length === 0 ? errors.days?.root?.message : null;

  const onSubmit = async (values) => {
    try {
      const saved = await updateDoctorSchedule(doctorId, clinicId, toBlocks(values.days));
      reset({ days: toWeekRows(saved.blocks) });
      onSaved?.(saved);
      toast.success('Availability updated', 'Patients can now book you within these hours.');
    } catch (error) {
      setError('root.server', { message: error.message });
      toast.error('Could not save your availability', error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="gold" size="md" className="text-on-secondary-fixed">
          {workingDays.length} working {workingDays.length === 1 ? 'day' : 'days'}
        </Badge>
        <Badge tone="neutral" size="md">
          {formatHours(weeklyHours)} / week
        </Badge>
      </div>

      <FormAlert>{errors.root?.server?.message}</FormAlert>
      <FormAlert>{noWorkingDayError}</FormAlert>

      <ul className="space-y-space-sm">
        {days.map((day, index) => (
          <DayRow key={day.dayOfWeek} index={index} day={day} register={register} error={errors.days?.[index]?.end?.message} />
        ))}
      </ul>

      <div className="flex flex-col-reverse gap-space-sm border-t border-surface-container-high pt-space-md sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {isDirty ? <span className="font-semibold text-secondary">You have unsaved changes.</span> : 'Hours follow Riyadh time (GMT+3).'}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="soft" leftIcon={RotateCcw} disabled={!isDirty || isSubmitting} onClick={() => reset()}>
            Discard
          </Button>
          <Button type="submit" leftIcon={Save} loading={isSubmitting}>
            Save availability
          </Button>
        </div>
      </div>
    </form>
  );
}
