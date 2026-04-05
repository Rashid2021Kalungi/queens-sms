import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import type { Config } from "../config.js";
import {
  sendSecurityOtp,
  type SecurityOtpKind,
} from "../mail/sendSecurityOtp.js";
import { SecurityOtpChallenge } from "../models/index.js";

export type { SecurityOtpKind };

export async function issueSecurityOtpChallenge(
  config: Config,
  params: { userId: number; email: string; purpose: SecurityOtpKind },
): Promise<{ ok: true } | { ok: false; error: string }> {
  await SecurityOtpChallenge.destroy({
    where: { userId: params.userId, purpose: params.purpose },
  });
  const code = String(crypto.randomInt(100_000, 1_000_000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await SecurityOtpChallenge.create({
    userId: params.userId,
    purpose: params.purpose,
    codeHash,
    expiresAt,
  });
  const sent = await sendSecurityOtp(
    config,
    params.email,
    code,
    params.purpose,
  );
  if (!sent.ok) {
    await SecurityOtpChallenge.destroy({
      where: { userId: params.userId, purpose: params.purpose },
    });
    return { ok: false, error: sent.error };
  }
  return { ok: true };
}

export function normalizeOtpDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export async function verifyAndConsumeSecurityOtpChallenge(
  userId: number,
  purpose: SecurityOtpKind,
  rawOtp: string,
): Promise<boolean> {
  const otp = normalizeOtpDigits(rawOtp);
  if (otp.length !== 6) return false;
  const row = await SecurityOtpChallenge.findOne({
    where: {
      userId,
      purpose,
      expiresAt: { [Op.gt]: new Date() },
    },
    order: [["id", "DESC"]],
  });
  if (!row) return false;
  const match = await bcrypt.compare(otp, row.codeHash);
  if (!match) return false;
  await row.destroy();
  return true;
}
