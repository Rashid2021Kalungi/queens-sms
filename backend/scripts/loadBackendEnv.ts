/**
 * Load `backend/.env` based on this file's location, not `process.cwd()`.
 * Use at the top of CLI scripts so `npm run …` works from any directory and
 * `tsx path/to/backend/scripts/foo.ts` still finds the correct database config.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDir, "..", ".env") });
