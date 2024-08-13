module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',  // This should include your Remix app's files
    './index.html',                // Include the HTML file if it exists
    './styles/**/*.css'            // Include any CSS files in your styles directory
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
