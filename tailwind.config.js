import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                'ankawa-deep':       '#291136',
                'ankawa-deep-hover': '#3D1A52',
                'ankawa-plum':       '#4A153D',
                'ankawa-rose':       '#BE0F4A',
                'ankawa-rose-hover': '#9C0A3B',
                'ankawa-crimson':    '#BC1D35',
                'ankawa-muted':      '#B23241',
            },
            fontFamily: {
                sans:  ['Figtree', ...defaultTheme.fontFamily.sans],
                serif: ['Fraunces', 'Source Serif 4', 'Georgia', ...defaultTheme.fontFamily.serif],
            },
            keyframes: {
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%':      { transform: 'translateY(-4px)' },
                },
                'float-urgent': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '25%':      { transform: 'translateY(-7px)' },
                    '50%':      { transform: 'translateY(-2px)' },
                    '75%':      { transform: 'translateY(-9px)' },
                },
            },
            animation: {
                'float-slow':   'float 4s ease-in-out infinite',
                'float-med':    'float 2s ease-in-out infinite',
                'float-urgent': 'float-urgent 0.9s ease-in-out infinite',
            },
        },
    },

    plugins: [forms],
};
