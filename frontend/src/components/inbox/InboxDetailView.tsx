import { useEffect, useState } from "react";
import {
  fetchMessage,
  fetchNotification,
  markMessageRead,
  markNotificationRead,
  type InboxApiItem,
  type InboxMessageApiItem,
} from "../../api/inbox";
import { useI18n } from "../../i18n/I18nProvider";
import { formatShortAgo } from "../../utils/formatShortAgo";

type Kind = "notifications" | "messages";

type InboxDetailViewProps = {
  kind: Kind;
  id: number;
  onBack: () => void;
  onInboxChanged: () => void;
};

export function InboxDetailView({
  kind,
  id,
  onBack,
  onInboxChanged,
}: InboxDetailViewProps) {
  const { t } = useI18n();
  const [item, setItem] = useState<InboxApiItem | InboxMessageApiItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row =
          kind === "notifications"
            ? await fetchNotification(id)
            : await fetchMessage(id);
        if (cancelled) return;
        setItem(row);
        if (!row.read) {
          if (kind === "notifications") await markNotificationRead(id);
          else await markMessageRead(id);
          if (!cancelled) {
            setItem((prev) => (prev ? { ...prev, read: true } : prev));
            onInboxChanged();
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t("inbox.loadError"));
          setItem(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, id, onInboxChanged, t]);

  const title =
    kind === "notifications"
      ? t("inbox.detail.notificationTitle")
      : t("inbox.detail.messageTitle");

  return (
    <article className="neo-card-elevated mx-auto max-w-3xl overflow-hidden">
      <header className="border-b border-[#ebe4d9] bg-gradient-to-r from-[#faf7f0] to-[#eef6f9] px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-2 text-xs font-bold text-[#5a8faf] transition hover:text-[#2d3436]"
        >
          ← {t("inbox.backToList")}
        </button>
        <h1 className="text-base font-bold text-[#2d3436]">{title}</h1>
      </header>

      <div className="px-4 py-5 sm:px-6">
        {loading ? (
          <p className="text-sm text-[#636e72]">{t("inbox.loading")}</p>
        ) : error ? (
          <p className="text-sm text-[#c0392b]">{error}</p>
        ) : item ? (
          <>
            <p className="text-xs font-bold uppercase tracking-wide text-[#636e72]">
              {formatShortAgo(item.createdAt)}
              {t("header.timeSuffix")}
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#2d3436]">{item.title}</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#2d3436]">
              {item.body}
            </p>
            <p className="mt-6 text-xs text-[#636e72]">{t("inbox.detail.markedHint")}</p>
          </>
        ) : null}
      </div>
    </article>
  );
}
