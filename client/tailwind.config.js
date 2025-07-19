/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}", // Make sure this covers all your React component files
        "./public/index.html",
    ],
    theme: {
        extend: {
        fontFamily: {
            inter: ['Inter', 'sans-serif'],
        },
        },
    },
    plugins: [
        require('@tailwindcss/forms'), // Re-add plugins here if they were outside
        require('@tailwindcss/typography'),
    ],
};