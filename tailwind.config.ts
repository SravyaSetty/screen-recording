import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#061E29',
                    primary: '#1D546D',
                    secondary: '#5F9598',
                    bg: '#F3F4F4',
                },
                primary: {
                    50: '#F0F7FA',
                    100: '#DDEEF4',
                    200: '#BDDEEA',
                    300: '#8FC5DB',
                    400: '#5F9598',
                    500: '#1D546D',
                    600: '#164359',
                    700: '#113548',
                    800: '#061E29',
                    900: '#04151D',
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
};

export default config;
