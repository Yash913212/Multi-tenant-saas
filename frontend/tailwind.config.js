/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable dark mode via class strategy
    theme: {
        extend: {
            colors: {
                // Custom colors for better theming
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554',
                },
                dark: {
                    bg: '#0f172a',
                    card: '#1e293b',
                    text: '#f8fafc',
                    muted: '#94a3b8'
                },
                // Vite-inspired palette used across the dashboard/auth screens
                'vite-primary': '#646cff',
                'vite-secondary': '#747bff',
                'vite-hover': '#535bf2',
                'vite-dark': '#0c1127',
                'vite-card': '#11182f',
                'vite-border': '#1f2945',
                'vite-text': '#e5e7ef',
                'vite-muted': '#94a3b8'
            }
        },
    },
    plugins: [],
}