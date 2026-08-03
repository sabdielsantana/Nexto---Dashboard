/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Los errores de tipos rompen el build a propósito: TS estricto es no negociable.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
