/*********************
 * Tailwind CSS Config
 *********************/
module.exports = {
  darkMode: 'class',
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        border: 'var(--border)',
        secondary: 'var(--secondary)',
        'muted-foreground': 'var(--muted-foreground)',
      },
    },
  },
  plugins: [],
};
