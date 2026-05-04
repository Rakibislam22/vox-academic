import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "navy-dark": "#050b18",
                "navy-darker": "#0d1428",
                "charcoal": "#141920",
                "electric-blue": "#1a8cff",
                "electric-blue-light": "#3da3ff",
                "cyan-accent": "#00d4ff",
                "electric-blue-10": "rgba(26, 140, 255, 0.1)",
                "cyan-accent-10": "rgba(0, 212, 255, 0.1)",
            },
            fontFamily: {
                syne: ["var(--font-syne)", "sans-serif"],
                "instrument-serif": ["var(--font-instrument-serif)", "serif"],
                "jetbrains-mono": ["var(--font-jetbrains-mono)", "monospace"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            boxShadow: {
                "electric": "0 0 20px rgba(26, 140, 255, 0.5)",
                "electric-lg": "0 0 40px rgba(26, 140, 255, 0.4)",
                "cyan": "0 0 20px rgba(0, 212, 255, 0.5)",
            },
        },
    },
    plugins: [require("daisyui")],
};

export default config;
