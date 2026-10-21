import { Client } from "pg";
import { readFileSync, readdirSync } from "node:fs";
if (!process.env.DATABASE_URL)
  throw Error(
    "Configura DATABASE_URL en tu entorno privado; nunca lo publiques.",
  );
if (process.env.TPPLAY_APPLY_MIGRATIONS !== "true")
  throw Error(
    "Revisa las migraciones y configura TPPLAY_APPLY_MIGRATIONS=true para aplicarlas.",
  );
const db = new Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  await db.query(
    "select pg_advisory_lock(hashtextextended('tpplay-migrations',0))",
  );
  await db.query(
    "create table if not exists public.tpplay_migrations(version text primary key,applied_at timestamptz not null default now());revoke all on public.tpplay_migrations from anon,authenticated;",
  );
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort()) {
    if (
      (
        await db.query(
          "select 1 from public.tpplay_migrations where version=$1",
          [file],
        )
      ).rowCount
    )
      continue;
    // An existing installation must explicitly baseline its previously applied migrations.
    if (
      file === "001_learning.sql" &&
      (await db.query("select to_regclass('public.profiles') as table_name"))
        .rows[0].table_name
    )
      throw Error(
        "Instalación existente: registra primero en tpplay_migrations únicamente los archivos que ya verificaste como aplicados. No se adivina el estado ni se repite DDL.",
      );
    const sql = readFileSync("supabase/migrations/" + file, "utf8")
      .replace(/^\s*begin;\s*$/im, "")
      .replace(/^\s*commit;\s*$/im, "");
    await db.query("begin");
    try {
      await db.query(sql);
      await db.query("insert into tpplay_migrations(version) values($1)", [
        file,
      ]);
      await db.query("commit");
      console.log("Aplicada: " + file);
    } catch {
      await db.query("rollback");
      throw Error(
        "Falló " +
          file +
          "; la transacción se revirtió. Revisa el esquema y el archivo antes de reintentar.",
      );
    }
  }
} finally {
  await db.end();
}
