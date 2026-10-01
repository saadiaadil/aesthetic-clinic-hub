/**
 * Aesthetic Clinic Hub design tokens.
 *
 * Ported 1:1 from the Google Stitch export (the `tailwind.config` block shared by
 * every Stitch screen) so the Stitch class names — `bg-surface-container-low`,
 * `font-headline-sm text-headline-sm`, `px-margin`, `gap-space-md` … — render
 * exactly as designed. Brand accents from `DESIGN.md` are added under `brand`.
 */

const serif = ['"Playfair Display Variable"', '"Playfair Display"', 'Georgia', 'serif'];
const sans = ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'];

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#64434d',
        'on-primary': '#ffffff',
        'primary-container': '#7e5a65',
        'on-primary-container': '#ffd7e2',
        'primary-fixed': '#ffd9e3',
        'primary-fixed-dim': '#e8bbc7',
        'on-primary-fixed': '#2d131d',
        'on-primary-fixed-variant': '#5e3d48',
        'inverse-primary': '#e8bbc7',

        secondary: '#775a19',
        'on-secondary': '#ffffff',
        'secondary-container': '#fed488',
        'on-secondary-container': '#785a1a',
        'secondary-fixed': '#ffdea5',
        'secondary-fixed-dim': '#e9c176',
        'on-secondary-fixed': '#261900',
        'on-secondary-fixed-variant': '#5d4201',

        tertiary: '#733b4d',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#8e5265',
        'on-tertiary-container': '#ffd8e1',
        'tertiary-fixed': '#ffd9e2',
        'tertiary-fixed-dim': '#fdb2c7',
        'on-tertiary-fixed': '#370a1c',
        'on-tertiary-fixed-variant': '#6c3548',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        background: '#fef8f6',
        'on-background': '#1d1b1a',
        surface: '#fef8f6',
        'surface-dim': '#dfd9d7',
        'surface-bright': '#fef8f6',
        'surface-tint': '#78555f',
        'surface-variant': '#e7e1df',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f9f2f0',
        'surface-container': '#f3edea',
        'surface-container-high': '#ede7e5',
        'surface-container-highest': '#e7e1df',
        'on-surface': '#1d1b1a',
        'on-surface-variant': '#4f4447',
        'inverse-surface': '#32302f',
        'inverse-on-surface': '#f6efed',
        outline: '#817477',
        'outline-variant': '#d3c3c6',

        // DESIGN.md brand accents (champagne, burgundy, sage, blush).
        brand: {
          champagne: '#c5a059',
          burgundy: '#562335',
          sage: '#6b8e7b',
          blush: '#e8a598',
        },
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        'space-xs': '0.375rem',
        'space-sm': '0.75rem',
        'space-md': '1.25rem',
        'space-lg': '2rem',
        'space-xl': '3.5rem',
        gutter: '1.5rem',
        'gutter-mobile': '1rem',
        margin: '3rem',
        'margin-mobile': '1.25rem',
      },
      maxWidth: {
        page: '1280px',
      },
      fontFamily: {
        sans,
        serif,
        'display-lg': serif,
        'display-lg-mobile': serif,
        'display-md': serif,
        'display-md-mobile': serif,
        'headline-lg': serif,
        'headline-md': serif,
        'headline-sm': serif,
        'title-lg': sans,
        'title-md': sans,
        'body-lg': sans,
        'body-md': sans,
        'body-sm': sans,
        'label-md': sans,
        'label-sm': sans,
      },
      fontSize: {
        'display-lg': ['56px', { lineHeight: '68px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-lg-mobile': ['38px', { lineHeight: '48px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'display-md': ['40px', { lineHeight: '52px', letterSpacing: '-0.015em', fontWeight: '500' }],
        'display-md-mobile': ['30px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '500' }],
        'headline-lg': ['32px', { lineHeight: '42px', fontWeight: '500' }],
        'headline-md': ['26px', { lineHeight: '36px', fontWeight: '500' }],
        'headline-sm': ['22px', { lineHeight: '30px', fontWeight: '600' }],
        'title-lg': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'title-md': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['17px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.06em', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        // DESIGN.md elevation levels.
        ambient: '0 4px 20px -2px rgba(126, 90, 101, 0.04)',
        lift: '0 12px 32px -4px rgba(28, 26, 25, 0.07), 0 2px 8px -1px rgba(126, 90, 101, 0.05)',
        modal: '0 24px 48px -12px rgba(28, 26, 25, 0.16)',
        header: '0 1px 8px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
