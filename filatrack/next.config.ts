import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Marge au-dessus de la limite par défaut (1 Mo) pour les photos de
      // profil encodées en base64 (redimensionnées côté client, ~20-60 Ko en usage normal).
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
