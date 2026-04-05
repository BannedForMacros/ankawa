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
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
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
