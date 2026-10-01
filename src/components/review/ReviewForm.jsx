import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/common/Button';
import { Field, Textarea } from '@/components/common/Form';
import { StarRatingInput } from '@/components/common/Rating';
import { FormAlert } from '@/components/common/States';

const METRICS = [
  { key: 'cleanliness', label: 'Cleanliness & Hygiene' },
  { key: 'consultation', label: 'Doctor Consultation' },
  { key: 'results', label: 'Natural Results' },
  { key: 'punctuality', label: 'Punctuality' },
];

const star = z.number({ invalid_type_error: 'Please rate this.' }).min(1, 'Please rate this.').max(5);

const schema = z.object({
  rating: star,
  cleanliness: star,
  consultation: star,
  results: star,
  punctuality: star,
  description: z
    .string()
    .trim()
    .min(20, 'Please share at least 20 characters about your visit.')
    .max(1200, 'Please keep your review under 1,200 characters.'),
});

/**
 * Verified review form (FR-8): overall stars, the four Stitch quality
 * metrics and a written review. Submitted reviews go to moderation.
 */
export function ReviewForm({ onSubmit, onCancel }) {
  const [serverError, setServerError] = useState('');
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rating: 0, cleanliness: 0, consultation: 0, results: 0, punctuality: 0, description: '' },
  });

  const submit = async (values) => {
    setServerError('');
    try {
      await onSubmit({
        rating: values.rating,
        subRatings: { cleanliness: values.cleanliness, consultation: values.consultation, results: values.results, punctuality: values.punctuality },
        description: values.description,
      });
    } catch (error) {
      setServerError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-space-md" noValidate>
      <FormAlert>{serverError}</FormAlert>
      <div>
        <p className="mb-2 font-label-md text-label-md uppercase tracking-wider text-on-surface">
          Overall experience <span className="text-tertiary">*</span>
        </p>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => <StarRatingInput name="rating" value={field.value} onChange={field.onChange} invalid={Boolean(errors.rating)} />}
        />
        {errors.rating && <p className="mt-1 font-body-sm text-body-sm text-error">{errors.rating.message}</p>}
      </div>
      <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
        {METRICS.map((metric) => (
          <div key={metric.key} className="rounded-lg bg-surface p-3">
            <p className="mb-1 font-label-md text-label-md text-on-surface">{metric.label}</p>
            <Controller
              name={metric.key}
              control={control}
              render={({ field }) => (
                <StarRatingInput name={metric.key} label={metric.label} size="md" value={field.value} onChange={field.onChange} invalid={Boolean(errors[metric.key])} />
              )}
            />
            {errors[metric.key] && <p className="mt-1 font-body-sm text-body-sm text-error">{errors[metric.key].message}</p>}
          </div>
        ))}
      </div>
      <Field label="Your review" required error={errors.description?.message} hint="Reviews are moderated and published within 24 hours. Please avoid sharing personal medical details.">
        <Textarea rows={4} surface="white" placeholder="How was your consultation, the treatment and the aftercare?" {...register('description')} />
      </Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="soft" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          Submit verified review
        </Button>
      </div>
    </form>
  );
}
