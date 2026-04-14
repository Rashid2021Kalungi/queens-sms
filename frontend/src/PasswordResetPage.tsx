import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { apiUrl } from "./api/baseUrl";

type PasswordResetPageProps = {
  onBack: () => void;
  onSuccess: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readJson<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function PasswordResetPage({ onBack, onSuccess }: PasswordResetPageProps) {
  const emailId = useId();
  const otpId = useId();
  const passId = useId();
  const confirmId = useId();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const lastAutoVerifiedOtp = useRef<string | null>(null);

  const sendCode = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setInfo(null);
      const trimmed = email.trim();
      if (!trimmed) {
        setError("Enter your email address.");
        return;
      }
      if (!EMAIL_RE.test(trimmed)) {
        setError("Please enter a valid email address.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/auth/request-password-reset"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });
        const data = await readJson<{ message?: string; error?: string }>(res);
        if (res.status === 404) {
          setError(
            data?.error ?? "No account is registered with this email address.",
          );
          return;
        }
        if (res.status === 400) {
          setError(data?.error ?? "Check the email address and try again.");
          return;
        }
        if (!res.ok) {
          if (res.status === 503 || data?.error === "Database unavailable") {
            setError(
              "The service is temporarily unavailable. Please try again later.",
            );
            return;
          }
          setError(data?.error ?? "Could not send code. Try again.");
          return;
        }
        setInfo(
          data?.message ?? "Verification code sent. Check your email.",
        );
        lastAutoVerifiedOtp.current = null;
        setStep(2);
      } catch {
        setError(
          "We couldn’t connect to the server. Check your internet connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [email],
  );

  const submitVerify = useCallback(async (digits: string) => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address.");
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (digits.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/verify-password-reset-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, otp: digits }),
      });
      const data = await readJson<{ resetToken?: string; error?: string }>(
        res,
      );
      if (res.status === 400) {
        setError(data?.error ?? "Invalid or expired verification code.");
        return;
      }
      if (res.status === 503 || data?.error === "Database unavailable") {
        setError(
          "The service is temporarily unavailable. Please try again later.",
        );
        return;
      }
      if (!res.ok || !data?.resetToken) {
        setError(data?.error ?? "Could not verify code. Try again.");
        return;
      }
      setResetToken(data.resetToken);
      setInfo("Code confirmed. Choose your new password below.");
      setStep(3);
    } catch {
      setError(
        "We couldn’t connect to the server. Check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (step !== 2) return;
    const digits = otp.replace(/\D/g, "");
    if (digits.length < 6) {
      lastAutoVerifiedOtp.current = null;
      return;
    }
    if (loading) return;
    if (lastAutoVerifiedOtp.current === digits) return;
    lastAutoVerifiedOtp.current = digits;
    void submitVerify(digits);
  }, [step, otp, loading, submitVerify]);

  const verifyCode = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      void submitVerify(otp.replace(/\D/g, ""));
    },
    [otp, submitVerify],
  );

  const resetPassword = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!resetToken) {
        setError("Your reset session expired. Start again from your email.");
        return;
      }
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(apiUrl("/api/auth/reset-password-with-token"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resetToken, newPassword }),
        });
        const data = await readJson<{ message?: string; error?: string }>(res);
        if (res.status === 400) {
          setError(data?.error ?? "Could not reset password.");
          return;
        }
        if (!res.ok) {
          if (res.status === 503 || data?.error === "Database unavailable") {
            setError(
              "The service is temporarily unavailable. Please try again later.",
            );
            return;
          }
          setError(data?.error ?? "Could not reset password.");
          return;
        }
        onSuccess();
      } catch {
        setError(
          "We couldn’t connect to the server. Check your internet connection and try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [resetToken, newPassword, confirmPassword, onSuccess],
  );

  const goDifferentEmail = useCallback(() => {
    lastAutoVerifiedOtp.current = null;
    setStep(1);
    setOtp("");
    setResetToken(null);
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setInfo(null);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f0e6] font-sans antialiased text-[#2d3436]">
      <div className="neo-app-bg flex flex-1 flex-col justify-center px-6 py-10 sm:px-10">
        <div className="neo-card relative mx-auto w-full max-w-md px-8 pb-9 pt-9 sm:px-10 sm:pb-10 sm:pt-10">
          <button
            type="button"
            onClick={onBack}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a8a0] to-[#e85d4c] text-white shadow-[2px_3px_8px_rgba(200,90,80,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] transition hover:brightness-110 active:scale-95 sm:right-4 sm:top-4"
            aria-label="Close and return to sign in"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <h1 className="pr-11 text-2xl font-bold text-[#2d3436] sm:pr-12">Reset password</h1>
          <p className="mt-2 text-sm text-[#636e72]">
            {step === 1
              ? "Enter the email registered on your account. We’ll send a 6-digit code if it exists."
              : step === 2
                ? "Enter the 6-digit code from your email. You’ll set a new password after it’s confirmed."
                : "Choose a new password for your account."}
          </p>
          {step === 1 ? (
            <form className="mt-8 space-y-5" onSubmit={sendCode} noValidate>
              <div>
                <label htmlFor={emailId} className="mb-1.5 block text-xs font-semibold text-[#636e72]">
                  Email
                </label>
                <div className="neo-inset flex h-12 items-center gap-3 px-4 focus-within:ring-2 focus-within:ring-[#b9d9eb]/70">
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-[#2d3436] outline-none placeholder:text-[#636e72]/70 disabled:opacity-60"
                  />
                </div>
              </div>
              {error ? (
                <p className="rounded-xl border border-[#f0c4c0]/80 bg-[#fce8e5]/80 px-3 py-2 text-sm text-[#2d3436]" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-gradient-to-br from-[#cde8cf] to-[#8fb892] text-[15px] font-bold text-[#2d3436] shadow-[4px_4px_12px_rgba(120,150,125,0.4),-2px_-2px_8px_rgba(255,255,255,0.85)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send verification code"}
              </button>
            </form>
          ) : step === 2 ? (
            <form className="mt-8 space-y-5" onSubmit={verifyCode} noValidate>
              <div className="rounded-xl border border-[#ebe4d9]/80 bg-[#faf7f0]/80 px-3 py-2 text-sm text-[#636e72]">
                <span className="font-semibold text-[#2d3436]">Email:</span> {email.trim()}
              </div>
              <div>
                <label htmlFor={otpId} className="mb-1.5 block text-xs font-semibold text-[#636e72]">
                  Verification code
                </label>
                <div className="neo-inset flex h-12 items-center px-4 focus-within:ring-2 focus-within:ring-[#b9d9eb]/70">
                  <input
                    id={otpId}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={12}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={loading}
                    className="min-w-0 flex-1 bg-transparent text-center text-lg tracking-[0.35em] text-[#2d3436] outline-none placeholder:text-[#636e72]/50 disabled:opacity-60"
                  />
                </div>
              </div>
              {info ? (
                <p className="rounded-xl bg-[#e8f2ec] px-3 py-2 text-sm text-[#2d3436]">{info}</p>
              ) : null}
              {error ? (
                <p className="rounded-xl border border-[#f0c4c0]/80 bg-[#fce8e5]/80 px-3 py-2 text-sm text-[#2d3436]" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-gradient-to-br from-[#cde8cf] to-[#8fb892] text-[15px] font-bold text-[#2d3436] shadow-[4px_4px_12px_rgba(120,150,125,0.4),-2px_-2px_8px_rgba(255,255,255,0.85)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Checking…" : "Verify code"}
              </button>
              <button
                type="button"
                onClick={goDifferentEmail}
                className="w-full text-center text-sm font-medium text-[#5a8faf] hover:underline"
              >
                Use a different email
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={resetPassword} noValidate>
              <div className="rounded-xl border border-[#ebe4d9]/80 bg-[#faf7f0]/80 px-3 py-2 text-sm text-[#636e72]">
                <span className="font-semibold text-[#2d3436]">Email:</span> {email.trim()}
              </div>
              {info ? (
                <p className="rounded-xl bg-[#e8f2ec] px-3 py-2 text-sm text-[#2d3436]">{info}</p>
              ) : null}
              <div>
                <label htmlFor={passId} className="mb-1.5 block text-xs font-semibold text-[#636e72]">
                  New password
                </label>
                <div className="neo-inset flex h-12 items-center px-4 focus-within:ring-2 focus-within:ring-[#b9d9eb]/70">
                  <input
                    id={passId}
                    type="password"
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-[#2d3436] outline-none placeholder:text-[#636e72]/70 disabled:opacity-60"
                  />
                </div>
              </div>
              <div>
                <label htmlFor={confirmId} className="mb-1.5 block text-xs font-semibold text-[#636e72]">
                  Confirm password
                </label>
                <div className="neo-inset flex h-12 items-center px-4 focus-within:ring-2 focus-within:ring-[#b9d9eb]/70">
                  <input
                    id={confirmId}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="min-w-0 flex-1 bg-transparent text-[15px] text-[#2d3436] outline-none placeholder:text-[#636e72]/70 disabled:opacity-60"
                  />
                </div>
              </div>
              {error ? (
                <p className="rounded-xl border border-[#f0c4c0]/80 bg-[#fce8e5]/80 px-3 py-2 text-sm text-[#2d3436]" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-full bg-gradient-to-br from-[#cde8cf] to-[#8fb892] text-[15px] font-bold text-[#2d3436] shadow-[4px_4px_12px_rgba(120,150,125,0.4),-2px_-2px_8px_rgba(255,255,255,0.85)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
              <button
                type="button"
                onClick={goDifferentEmail}
                className="w-full text-center text-sm font-medium text-[#5a8faf] hover:underline"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
