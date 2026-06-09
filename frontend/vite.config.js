import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

function resolveApiProxyTarget(env) {
  const explicitTarget = env.VITE_API_PROXY_TARGET?.trim();
  if (explicitTarget) {
    return explicitTarget;
  }

  const configuredBaseUrl = env.VITE_API_BASE_URL?.trim();
  if (!configuredBaseUrl || configuredBaseUrl.startsWith("/")) {
    return "http://127.0.0.1:5000";
  }

  try {
    return new URL(configuredBaseUrl).origin;
  } catch {
    return "http://127.0.0.1:5000";
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: resolveApiProxyTarget(env),
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
