/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind v4: el plugin de PostCSS vive en su propio paquete y ya
    // incluye el prefijado de vendors, así que autoprefixer sobra.
    "@tailwindcss/postcss": {},
  },
};

export default config;
