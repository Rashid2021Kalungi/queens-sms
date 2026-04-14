import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { Config } from "../config.js";

export async function sendPasswordResetOtp(
  config: Config,
  to: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const text = `Your Queens Junior School portal verification code is: ${code}

It expires in 15 minutes. If you didn't request this, you can ignore this message.`;

  const html = `<p>Your Queens Junior School portal verification code is:</p>
<p style="font-size:1.5rem;letter-spacing:0.2em;font-weight:700">${code}</p>
<p>It expires in 15 minutes. If you didn&rsquo;t request this, you can ignore this message.</p>`;

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
        subject: "Your password reset code",
        html,
        text,
      });

      if (error) {
        console.error("[password-reset] Resend error:", error);
        return {
          ok: false,
          error: "Could not send verification email. Try again later.",
        };
      }
      return { ok: true };
    } catch (err) {
      console.error("[password-reset] Resend error:", err);
      return {
        ok: false,
        error: "Could not send verification email. Try again later.",
      };
    }
  }

  const host = config.SMTP_HOST?.trim();
  if (!host) {
    if (config.NODE_ENV === "development") {
      console.info(`\n[password-reset] OTP for ${to}: ${code}\n`);
    } else {
      console.warn(
        "[password-reset] Set RESEND_API_KEY or SMTP_HOST in .env to send OTP by email.",
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
      subject: "Your password reset code",
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[password-reset] SMTP error:", err);
    return { ok: false, error: "Could not send verification email. Try again later." };
  }
}
