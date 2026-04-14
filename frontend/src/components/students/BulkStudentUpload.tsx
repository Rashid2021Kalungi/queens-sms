import { useState } from "react";
import { bulkUploadStudentsCsv } from "../../api/students";
import { useI18n } from "../../i18n/I18nProvider";

type BulkStudentUploadProps = {
  onDone: () => void;
};

export function BulkStudentUpload({ onDone }: BulkStudentUploadProps) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!file) {
      setError(t("students.bulk.noFile"));
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const r = await bulkUploadStudentsCsv(file);
      setMessage(t("students.bulk.created").replace("{n}", String(r.created)));
      if (r.errors.length > 0) {
        const lines = r.errors
          .slice(0, 8)
          .map((e) => `${t("students.bulk.line")} ${e.line}: ${e.error}`)
          .join("\n");
        setError(r.errors.length > 8 ? `${lines}\n…` : lines);
      }
      setFile(null);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("students.bulk.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#ebe4d9] bg-[#fffcf7] shadow-[6px_8px_24px_rgba(45,52,54,0.08)]">
      <div className="border-b border-[#ebe4d9] bg-gradient-to-r from-[#f8f9f6] to-[#eef6f9] px-5 py-4">
        <h2 className="text-base font-bold text-[#2d3436]">{t("students.bulk.title")}</h2>
      </div>
      <div className="space-y-3 p-5">
        <p className="text-xs leading-relaxed text-[#636e72]">{t("students.bulk.hint")}</p>
        {message ? (
          <p className="text-sm font-medium text-emerald-800" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <pre className="whitespace-pre-wrap text-xs text-rose-800" role="alert">
            {error}
          </pre>
        ) : null}
        <input
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-sm text-[#636e72] file:mr-3 file:rounded-lg file:border-0 file:bg-[#cde8cf] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#2d3436]"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          disabled={busy || !file}
          onClick={() => void submit()}
          className="rounded-full bg-gradient-to-br from-[#5a8faf] to-[#3d6d8a] px-6 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t("students.bulk.uploading") : t("students.bulk.submit")}
        </button>
      </div>
    </section>
  );
}
