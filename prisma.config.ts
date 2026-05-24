import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
  // DATABASE_URL is injected at runtime via the PrismaPg adapter in src/lib/db.ts.
  // We use process.env here (not the strict env() helper) so that `prisma generate`
  // succeeds during CI/build even when DATABASE_URL is not yet available.
  ...(process.env.DATABASE_URL
    ? { datasource: { url: process.env.DATABASE_URL } }
    : {}),
});