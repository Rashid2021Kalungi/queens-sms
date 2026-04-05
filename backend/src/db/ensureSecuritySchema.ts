import type { Sequelize } from "sequelize";

/** MySQL ER_DUP_FIELDNAME — column already exists */
const MYSQL_DUP_FIELDNAME = 1060;

/**
 * Additive DDL for deployments that skipped `sequelize.sync` or used an older schema.
 * Safe to run on every API startup (idempotent).
 */
export async function ensureSecuritySchema(sequelize: Sequelize): Promise<void> {
  if (sequelize.getDialect() !== "mysql") {
    return;
  }

  try {
    await sequelize.query(
      "ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0",
    );
    console.info("[db] Added column users.two_factor_enabled");
  } catch (e: unknown) {
    const errno = (e as { parent?: { errno?: number } })?.parent?.errno;
    if (errno !== MYSQL_DUP_FIELDNAME) {
      throw e;
    }
  }

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS security_otp_challenges (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      purpose VARCHAR(32) NOT NULL,
      code_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY security_otp_challenges_user_purpose_idx (user_id, purpose),
      KEY security_otp_challenges_expires_idx (expires_at),
      CONSTRAINT fk_security_otp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
