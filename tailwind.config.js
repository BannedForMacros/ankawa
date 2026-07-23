import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './resources/js/**/*.js',
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
                // Montserrat es la fuente de marca (Manual de Identidad) — antes el default
                // era Figtree y Montserrat solo llegaba por estilos inline en algunas páginas.
                sans:  ['Montserrat', ...defaultTheme.fontFamily.sans],
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
                // ─── Landing (Welcome.jsx) — usar siempre con prefijo motion-safe: ───
                'fade-up-blur': {
                    from: { opacity: '0', transform: 'translateY(24px)', filter: 'blur(6px)' },
                    to:   { opacity: '1', transform: 'translateY(0)',    filter: 'blur(0)' },
                },
                'kenburns': {
                    from: { transform: 'scale(1.05)' },
                    to:   { transform: 'scale(1)' },
                },
                'shine': {
                    from: { transform: 'translateX(-160%) skewX(-20deg)' },
                    to:   { transform: 'translateX(360%) skewX(-20deg)' },
                },
                'pulse-ring': {
                    from: { transform: 'scale(1)',   opacity: '0.5' },
                    to:   { transform: 'scale(1.5)', opacity: '0' },
                },
                // Pulso sutil: reposa el 90% del ciclo, late brevemente al final
                'shield-pulse': {
                    '0%, 88%, 100%': { transform: 'scale(1)' },
                    '92%':           { transform: 'scale(1.2)' },
                    '96%':           { transform: 'scale(0.95)' },
                },
                'icon-bounce': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '35%':      { transform: 'translateY(-4px)' },
                    '70%':      { transform: 'translateY(1px)' },
                },
                'chevron-drift': {
                    '0%, 100%': { transform: 'translateY(0)',   opacity: '0.55' },
                    '50%':      { transform: 'translateY(6px)', opacity: '1' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to:   { opacity: '1' },
                },
                // Cross-fade + slide del cambio de paso en los logins OTP
                'step-in-right': {
                    from: { opacity: '0', transform: 'translateX(16px)' },
                    to:   { opacity: '1', transform: 'translateX(0)' },
                },
                'step-in-left': {
                    from: { opacity: '0', transform: 'translateX(-16px)' },
                    to:   { opacity: '1', transform: 'translateX(0)' },
                },
            },
            animation: {
                'float-slow':   'float 4s ease-in-out infinite',
                'float-med':    'float 2s ease-in-out infinite',
                'float-urgent': 'float-urgent 0.9s ease-in-out infinite',
                'fade-up-blur':    'fade-up-blur 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
                'kenburns-slow':   'kenburns 8s ease-out both',
                'shine':           'shine 0.9s cubic-bezier(0.22, 1, 0.36, 1) both',
                'pulse-ring-slow': 'pulse-ring 2.8s ease-out infinite',
                'shield-pulse':    'shield-pulse 6s ease-in-out infinite',
                'icon-bounce':     'icon-bounce 0.5s ease-in-out',
                'chevron-drift':   'chevron-drift 2.2s ease-in-out infinite',
                'fade-in':         'fade-in 0.8s ease-out both',
                'fade-in-slow':    'fade-in 2s ease-out both',
                'kenburns-xslow':  'kenburns 10s ease-out both',
                'step-in-right':   'step-in-right 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
                'step-in-left':    'step-in-left 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
                'pulse-ring-twice': 'pulse-ring 1.1s ease-out 0.35s 2 both',
            },
        },
    },

    plugins: [forms],
};
