import { mkdirSync, closeSync, openSync } from "node:fs";
import { resolve } from "node:path";

const api = resolve(import.meta.dir, "../../../api");
const directory = resolve(api, "storage/framework/testing");
mkdirSync(directory, { recursive: true });
const database = resolve(directory, "browser-e2e.sqlite");
closeSync(openSync(database, "a"));
const env = {
  ...process.env,
  APP_ENV: "testing",
  APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  APP_DEBUG: "false",
  DB_URL: "",
  DB_CONNECTION: "sqlite",
  DB_DATABASE: database,
  CACHE_STORE: "array",
  SESSION_DRIVER: "array",
  QUEUE_CONNECTION: "sync",
  LOG_CHANNEL: "stderr",
};
const migration = Bun.spawnSync(
  ["php", "artisan", "migrate:fresh", "--seed", "--force"],
  { cwd: api, env, stdout: "inherit", stderr: "inherit" },
);
if (migration.exitCode) process.exit(migration.exitCode);
const server = Bun.spawn(
  [
    "php",
    "artisan",
    "serve",
    "--host=127.0.0.1",
    "--port=18000",
    "--no-reload",
  ],
  { cwd: api, env, stdout: "inherit", stderr: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.kill(signal);
  });
}
process.exit(await server.exited);
