// Runs `prisma migrate deploy` during the Vercel build, so the database is
// always on the schema the new code expects. It only runs when
// DIRECT_DATABASE_URL is set: migrations need a direct (non-pooled)
// connection, while DATABASE_URL on Vercel is usually the pooled one.
// Locally (no VERCEL env var) it does nothing; run `npx prisma migrate deploy` yourself.
import { spawnSync } from "node:child_process";

const direct = process.env.DIRECT_DATABASE_URL?.trim();

if (!process.env.VERCEL) {
  process.exit(0);
}
if (!direct) {
  console.warn(
    "[migrate] DIRECT_DATABASE_URL is not set, so database migrations were NOT applied. " +
      "Add it in Vercel (your database's direct connection string) or run `npx prisma migrate deploy` yourself."
  );
  process.exit(0);
}

console.log("[migrate] Applying database migrations…");
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: direct },
});
// A failed migration must fail the deploy, or the new code would run against the old schema.
process.exit(result.status ?? 1);
