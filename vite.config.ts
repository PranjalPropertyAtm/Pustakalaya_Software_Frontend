import path from "path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";

/** Recharts default-imports es-toolkit/compat/*, which are CJS-only; map to the ESM barrel. */
function esToolkitCompatPlugin(): Plugin {
  const prefix = "es-toolkit/compat/";
  const virtualPrefix = "\0es-toolkit-compat:";
  return {
    name: "es-toolkit-compat-default-export",
    resolveId(source) {
      if (!source.startsWith(prefix)) return;
      const name = source.slice(prefix.length);
      if (!name || name.includes("/")) return;
      return virtualPrefix + name;
    },
    load(id) {
      if (!id.startsWith(virtualPrefix)) return;
      const name = id.slice(virtualPrefix.length);
      return `import { ${name} } from "es-toolkit/compat";\nexport default ${name};\n`;
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    esToolkitCompatPlugin(),
    react(),
    tailwindcss(),
    viteCompression({ algorithm: "brotliCompress", ext: ".br", threshold: 1024 }),
    viteCompression({ algorithm: "gzip", ext: ".gz", threshold: 1024 }),
    mode === "analyze" &&
      visualizer({
        open: false,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    sourcemap: false,
    cssMinify: true,
    minify: true,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            if (id.includes("/src/lib/export/export-csv")) return "export-csv";
            if (id.includes("/src/lib/export/export-xlsx")) return "export-xlsx";
            if (id.includes("/src/lib/export/export-pdf")) return "export-pdf";
            if (id.includes("/src/components/charts/DashboardCharts")) return "charts";
            if (id.includes("/src/pages/reports/")) return "reports";
            return;
          }

          if (id.includes("xlsx") || id.includes("sheetjs")) return "export-xlsx";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "export-pdf";
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor") || id.includes("es-toolkit")) {
            return "charts";
          }
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router")) {
            return "react-vendor";
          }
          if (id.includes("@tanstack/react-query")) return "query";
          if (id.includes("@tanstack/react-table") || id.includes("@tanstack/react-virtual")) {
            return "table";
          }
          if (id.includes("@radix-ui")) return "radix";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("socket.io")) return "socket";
          if (id.includes("date-fns")) return "date-fns";
          if (id.includes("axios")) return "axios";
          if (id.includes("react-hook-form") || id.includes("zod") || id.includes("@hookform")) {
            return "forms";
          }
          if (id.includes("@fontsource")) return "fonts";
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "socket.io-client",
      "debug",
      "recharts",
      "es-toolkit/compat",
    ],
    exclude: ["xlsx", "jspdf", "html2canvas"],
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
}));
