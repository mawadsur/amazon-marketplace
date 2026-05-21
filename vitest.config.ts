import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
    // env.ts validates required vars at import time; provide harmless defaults
    // so pure-function tests can import freely without a live DB / Redis.
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      exclude: ["src/lib/**/__tests__/**", "src/lib/db.ts", "src/lib/auth*.ts"],
      reporter: ["text", "html"],
    },
  },
});
