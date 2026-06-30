import "dotenv/config";
import { defineConfig } from "prisma/config";

// Use process.env (not env()) so `prisma generate` works when DATABASE_URL is unset
// (e.g. Vercel postinstall). Migrations still need a real DATABASE_URL at runtime.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
