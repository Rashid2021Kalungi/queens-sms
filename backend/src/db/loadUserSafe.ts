import { User } from "../models/index.js";

function isUnknownTwoFactorColumnError(e: unknown): boolean {
  const msg = String((e as Error)?.message ?? "");
  if (msg.includes("Unknown column") && msg.includes("two_factor_enabled")) {
    return true;
  }
  const errno = (e as { parent?: { errno?: number } })?.parent?.errno;
  /** MySQL ER_BAD_FIELD_ERROR */
  return errno === 1054 && msg.includes("two_factor_enabled");
}

/**
 * Load email / role / 2FA flag even if `users.two_factor_enabled` is missing (legacy DB).
 */
export async function loadUserMeFields(
  userId: number,
  jwtFallback: { email: string; role: string },
): Promise<{ email: string; role: string; twoFactorEnabled: boolean }> {
  try {
    const row = await User.findByPk(userId, {
      attributes: ["email", "role", "twoFactorEnabled"],
    });
    return {
      email: row?.email ?? jwtFallback.email,
      role: row?.role ?? jwtFallback.role,
      twoFactorEnabled: Boolean(row?.twoFactorEnabled),
    };
  } catch (e) {
    if (!isUnknownTwoFactorColumnError(e)) throw e;
    const row = await User.findByPk(userId, {
      attributes: ["email", "role"],
    });
    return {
      email: row?.email ?? jwtFallback.email,
      role: row?.role ?? jwtFallback.role,
      twoFactorEnabled: false,
    };
  }
}

export async function loadUserEmailAndTwoFactor(
  userId: number,
): Promise<{ email: string; twoFactorEnabled: boolean } | null> {
  try {
    const row = await User.findByPk(userId, {
      attributes: ["email", "twoFactorEnabled"],
    });
    if (!row) return null;
    return {
      email: row.email,
      twoFactorEnabled: Boolean(row.twoFactorEnabled),
    };
  } catch (e) {
    if (!isUnknownTwoFactorColumnError(e)) throw e;
    const row = await User.findByPk(userId, {
      attributes: ["email"],
    });
    if (!row) return null;
    return { email: row.email, twoFactorEnabled: false };
  }
}
