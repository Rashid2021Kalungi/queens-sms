import "dotenv/config";
import { loadConfig } from "../src/config.js";
import { ensureSecuritySchema } from "../src/db/ensureSecuritySchema.js";
import { setupDatabase } from "../src/models/index.js";

/**
 * Align MySQL tables with Sequelize models (creates missing tables / columns).
 * Local `npm run dev` already syncs on startup (development) unless DB_SYNC_ON_START=false.
 * Use this script for one-off/CI. Production: refuses unless ALLOW_PRODUCTION_DB_SYNC=1.
 */
async function main() {
  const config = loadConfig();
  const allowProd = process.env.ALLOW_PRODUCTION_DB_SYNC === "1";

  if (config.NODE_ENV === "production" && !allowProd) {
    console.error(
      "Refusing to run db:sync against NODE_ENV=production.\n" +
        "Apply backend/db/schema.sql or set ALLOW_PRODUCTION_DB_SYNC=1 if you intend to alter production.",
    );
    process.exit(1);
  }

  if (config.NODE_ENV === "production" && allowProd) {
    console.warn("ALLOW_PRODUCTION_DB_SYNC=1 — running sequelize.sync({ alter: true }) on production.");
  }

  const sequelize = setupDatabase(config);
  await sequelize.authenticate();
  await ensureSecuritySchema(sequelize);
  console.info("[db:sync] Running sequelize.sync({ alter: true })…");
  try {
    await sequelize.sync({ alter: true });
  } catch (err) {
    console.error(
      "[db:sync] sync failed. If you see ER_TOO_MANY_KEYS, prune duplicate indexes on affected tables or apply backend/db/schema.sql in MySQL.",
      err,
    );
    process.exit(1);
  }
  console.info("[db:sync] Done. Tables match models (including password_reset_otps).");
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
