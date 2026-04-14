import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { Config } from "../config.js";

export type SecurityOtpKind =
  | "login_2fa"
  | "password_change"
  | "two_factor_on"
  | "two_factor_off";

const copy: Record<
  SecurityOtpKind,
  { subject: string; lead: string }
> = {
  login_2fa: {
    subject: "Your sign-in verification code",
    lead: "Enter this code to complete signing in to the Queens Junior School portal.",
  },
  password_change: {
    subject: "Verify your password change",
    lead: "Enter this code to confirm changing your portal password.",
  },
  two_factor_on: {
    subject: "Confirm two-factor authentication",
    lead: "Enter this code to turn on two-factor authentication for your account.",
  },
  two_factor_off: {
    subject: "Confirm turning off two-factor authentication",
    lead: "Enter this code to turn off two-factor authentication for your account.",
  },
};

export async function sendSecurityOtp(
  config: Config,
  to: string,
  code: string,
  kind: SecurityOtpKind,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { subject, lead } = copy[kind];
  const text = `${lead}

Your code: ${code}

It expires in 15 minutes. If you didn't request this, secure your account and contact your school administrator.`;

  const html = `<p>${lead}</p>
<p style="font-size:1.5rem;letter-spacing:0.2em;font-weight:700">${code}</p>
<p>It expires in 15 minutes. If you didn&rsquo;t request this, secure your account and contact your school administrator.</p>`;

  const resendKey = config.RESEND_API_KEY?.trim();
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const from =
        config.RESEND_FROM?.trim() ||
        config.SMTP_FROM?.trim() ||
        "Queens Junior School <onboarding@resend.dev>";

      const { error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
      });

      if (error) {
        console.error("[security-otp] Resend error:", error);
        return {
          ok: false,
          error: "Could not send verification email. Try again later.",
        };
      }
      return { ok: true };
    } catch (err) {
      console.error("[security-otp] Resend error:", err);
      return {
        ok: false,
        error: "Could not send verification email. Try again later.",
      };
    }
  }

  const host = config.SMTP_HOST?.trim();
  if (!host) {
    if (config.NODE_ENV === "development") {
      console.info(`\n[security-otp:${kind}] OTP for ${to}: ${code}\n`);
    } else {
      console.warn(
        "[security-otp] Set RESEND_API_KEY or SMTP_HOST in .env to send OTP by email.",
      );
    }
    return { ok: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: config.SMTP_PORT || 587,
      secure: (config.SMTP_PORT || 587) === 465,
      auth: config.SMTP_USER?.trim()
        ? { user: config.SMTP_USER.trim(), pass: config.SMTP_PASS ?? "" }
        : undefined,
    });

    const from =
      config.SMTP_FROM?.trim() || config.SMTP_USER?.trim() || "noreply@localhost";

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[security-otp] SMTP error:", err);
    return { ok: false, error: "Could not send verification email. Try again later." };
  }
}
