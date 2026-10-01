import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge taught about the Stitch design tokens, so a `className`
 * passed to a component reliably overrides the component's defaults
 * (e.g. <Button className="text-primary" /> replaces the variant's text colour)
 * and custom type sizes like `text-label-sm` are not mistaken for colours.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ['space-xs', 'space-sm', 'space-md', 'space-lg', 'space-xl', 'gutter', 'gutter-mobile', 'margin', 'margin-mobile'],
    },
    classGroups: {
      'font-size': [
        {
          text: [
            'display-lg',
            'display-lg-mobile',
            'display-md',
            'display-md-mobile',
            'headline-lg',
            'headline-md',
            'headline-sm',
            'title-lg',
            'title-md',
            'body-lg',
            'body-md',
            'body-sm',
            'label-md',
            'label-sm',
          ],
        },
      ],
      shadow: [{ shadow: ['ambient', 'lift', 'modal', 'header'] }],
      'max-w': [{ 'max-w': ['page'] }],
    },
  },
});

/**
 * Joins class names (skipping falsy values) and resolves Tailwind conflicts,
 * later classes winning: cn('px-4 text-on-surface', active && 'text-primary').
 */
export function cn(...classes) {
  return twMerge(classes.flat().filter(Boolean).join(' '));
}
