import { useCallback, useEffect, useState, type MouseEvent } from "react";
import {
  fetchMessages,
  fetchNotifications,
  markMessageRead,
  markNotificationRead,
  markAllMessagesRead,
  markAllNotificationsRead,
  type InboxApiItem,
  type InboxMessageApiItem,
} from "../../api/inbox";
import { useI18n } from "../../i18n/I18nProvider";
import { formatShortAgo } from "../../utils/formatShortAgo";

type Kind = "notifications" | "messages";

type InboxListViewProps = {
  kind: Kind;
  onBack: () => void;
  onSelectItem: (id: number) => void;
  onInboxChanged: () => void;
};

export function InboxListView({
  kind,
  onBack,
  onSelectItem,
  onInboxChanged,
}: InboxListViewProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<(InboxApiItem | InboxMessageApiItem)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows =
        kind === "notifications"
          ? await fetchNotifications()
          : await fetchMessages();
      setItems(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("inbox.loadError"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [kind, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const title =
    kind === "notifications"
      ? t("inbox.list.notificationsTitle")
      : t("inbox.list.messagesTitle");

  const unreadCount = items.filter((i) => !i.read).length;

  async function handleMarkAll() {
    try {
      if (kind === "notifications") await markAllNotificationsRead();
      else await markAllMessagesRead();
      await load();
      onInboxChanged();
    } catch {
      setError(t("inbox.loadError"));
    }
  }

  async function handleMarkOne(id: number, e: MouseEvent) {
    e.stopPropagation();
    try {
      if (kind === "notifications") await markNotificationRead(id);
      else await markMessageRead(id);
      setItems((prev) =>
        prev.map((row) => (row.id === id ? { ...row, read: true } : row)),
      );
      onInboxChanged();
    } catch {
      setError(t("inbox.loadError"));
    }
  }

  return (
    <section className="neo-card-elevated mx-auto max-w-3xl overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebe4d9] bg-gradient-to-r from-[#faf7f0] to-[#eef6f9] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-[#5a8faf] transition hover:bg-[#b9d9eb]/30"
          >
            ← {t("inbox.back")}
          </button>
          <h1 className="truncate text-base font-bold text-[#2d3436]">{title}</h1>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            className="shrink-0 rounded-full bg-gradient-to-br from-[#b8d8ba] to-[#8fb892] px-4 py-1.5 text-xs font-bold text-[#2d3436] shadow-[2px_2px_6px_rgba(120,150,125,0.35)] transition hover:brightness-105"
          >
            {t("inbox.markAllRead")}
          </button>
        ) : null}
      </header>

      <div className="px-4 py-3 sm:px-5">
        {loading ? (
          <p className="py-8 text-center text-sm text-[#636e72]">{t("inbox.loading")}</p>
        ) : error ? (
          <div className="space-y-3 py-4 text-center">
            <p className="text-sm text-[#c0392b]">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-full bg-[#b9d9eb]/50 px-4 py-2 text-xs font-bold text-[#2d3436]"
            >
              {t("dashboard.retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#636e72]">{t("inbox.list.empty")}</p>
        ) : (
          <ul className="divide-y divide-[#ebe4d9]/70">
            {items.map((row) => (
              <li key={row.id}>
                <div className="flex gap-2 py-3 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectItem(row.id)}
                    className={`min-w-0 flex-1 rounded-xl px-2 py-2 text-left transition hover:bg-[#b9d9eb]/15 sm:px-3 ${
                      row.read ? "opacity-90" : "bg-[#f5f0e6]/60"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#2d3436]">{row.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#636e72]">
                      {row.body}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-[#5a8faf]">
                      {formatShortAgo(row.createdAt)}
                      {t("header.timeSuffix")}
                    </p>
                  </button>
                  {!row.read ? (
                    <button
                      type="button"
                      onClick={(e) => void handleMarkOne(row.id, e)}
                      className="self-center shrink-0 rounded-lg border border-[#ebe4d9] px-2 py-1.5 text-[10px] font-bold text-[#5a8faf] transition hover:bg-[#b9d9eb]/25"
                    >
                      {t("inbox.markRead")}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
