/**
 * Probes Hermes and OpenClaw endpoints from .env (Phase 0 setup).
 * Run: npx tsx scripts/setup-runtime-health.mjs
 */
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const hermesEndpoint =
  process.env.HERMES_ENDPOINT?.trim() || "http://127.0.0.1:8080";
const openclawEndpoint =
  process.env.OPENCLAW_ENDPOINT?.trim() ||
  process.env.OPENCLAW_GATEWAY_URL?.trim() ||
  "http://127.0.0.1:18789";

async function probe(name, url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(5_000),
    });
    console.log(`${name}: ${response.status} ${url}`);
    return response.ok || response.status < 500;
  } catch (error) {
    console.log(
      `${name}: unreachable ${url} —`,
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

console.log("HERMES_MODE:", process.env.HERMES_MODE ?? "stub");
console.log("OPENCLAW_MODE:", process.env.OPENCLAW_MODE ?? "stub");

const hermesOk = await probe("Hermes", `${hermesEndpoint.replace(/\/$/, "")}/health`);
const openclawOk = await probe(
  "OpenClaw",
  `${openclawEndpoint.replace(/\/$/, "")}/health`,
);

process.exit(hermesOk && openclawOk ? 0 : 1);
