import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "*.png", "*.svg"],
      manifest: {
        name: "Oscar — Votre assistant",
        short_name: "Oscar",
        description: "Votre assistant senior",
        theme_color: "#2DD4BF",
        background_color: "#ffffff",
        display: "standalone",
        lang: "fr",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/oscar-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/oscar-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /\/services\/emergency/,
            handler: "CacheFirst",
            options: {
              cacheName: "emergency-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
              },
            },
          },
          {
            urlPattern: /supabase\.co\/functions/,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-edge-functions",
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
