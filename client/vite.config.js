import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],

  build: {
    outDir: "build",
    chunkSizeWarningLimit: 2000, // Adjust the chunk size warning limit to 2000 kB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Implement manual chunking if necessary
          // Example: Chunking third-party libraries into a separate chunk
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },

  server: {
    port: 3000,
  },
});
