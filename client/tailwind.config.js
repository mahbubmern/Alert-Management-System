/** @type {import('tailwindcss').Config} */
export default {
  // prefix: "tw-",

  corePlugins: {
    preflight: false, // Bootstrap এর CSS reset safe থাকবে
  },
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};