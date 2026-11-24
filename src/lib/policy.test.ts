import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// AGENTS.md forbids a backend, login or database. No database client may
// appear in package.json dependencies or devDependencies.
const FORBIDDEN_DB_PACKAGES = [
  "supabase",
  "@supabase/supabase-js",
  "pg",
  "pglite",
  "@electric-sql/pglite",
  "mysql",
  "mysql2",
  "mongodb",
  "mongoose",
  "redis",
  "ioredis",
  "prisma",
  "@prisma/client",
  "drizzle-orm",
  "knex",
  "sequelize",
  "typeorm",
  "better-sqlite3",
  "sqlite3",
];

function readDeps(section: "dependencies" | "devDependencies"): string[] {
  const raw = readFileSync(resolve(__dirname, "../../package.json"), "utf-8");
  const pkg = JSON.parse(raw) as Record<string, unknown>;
  const deps = pkg[section];
  if (deps === undefined) return [];
  if (typeof deps !== "object" || deps === null) {
    throw new Error(`package.json "${section}" has an unexpected shape`);
  }
  return Object.keys(deps);
}

describe("policy: no database clients in package.json", () => {
  it("dependencies contain no database client", () => {
    const deps = readDeps("dependencies");
    const offenders = deps.filter((name) =>
      FORBIDDEN_DB_PACKAGES.includes(name)
    );
    expect(offenders, `database client(s) in dependencies: ${offenders.join(", ")}`).toEqual([]);
  });

  it("devDependencies contain no database client", () => {
    const deps = readDeps("devDependencies");
    const offenders = deps.filter((name) =>
      FORBIDDEN_DB_PACKAGES.includes(name)
    );
    expect(
      offenders,
      `database client(s) in devDependencies: ${offenders.join(", ")}`
    ).toEqual([]);
  });
});
