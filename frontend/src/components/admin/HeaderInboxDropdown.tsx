import type { InboxItem } from "./headerInboxDemo";

type Variant = "notification" | "message";

type HeaderInboxDropdownProps = {
  open: boolean;
  title: string;
  emptyLabel: string;
  markAllLabel: string;
  readMoreLabel: string;
  timeSuffix: string;
  items: InboxItem[];
  variant: Variant;
  onMarkAllRead: () => void;
  /** Opens full detail for this item (parent marks read when detail loads). */
  onItemClick: (id: string) => void;
  onReadMore: () => void;
};

export function HeaderInboxDropdown({
  open,
  title,
  emptyLabel,
  markAllLabel,
  readMoreLabel,
  timeSuffix,
  items,
  variant,
  onMarkAllRead,
  onItemClick,
  onReadMore,
}: HeaderInboxDropdownProps) {
  if (!open) return null;

  const unread = items.filter((i) => !i.read).length;
  const dotClass =
    variant === "notification"
      ? "bg-gradient-to-br from-[#f7d1cd] to-[#e8a8a2]"
      : "bg-gradient-to-br from-[#b9d9eb] to-[#8bb8d4]";

  return (
    <div
      role="dialog"
      aria-label={title}
      className="neo-dropdown absolute right-0 top-full z-[60] mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden py-0 shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-[#ebe4d9]/80 bg-gradient-to-r from-[#faf7f0] to-[#eef6f9] px-3 py-2.5">
        <h2 className="text-sm font-bold text-[#2d3436]">{title}</h2>
        {unread > 0 ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-[#2d3436] ${dotClass} shadow-sm`}
          >
            {unread}
          </span>
        ) : null}
      </div>

      <div className="max-h-[min(22rem,55vh)] overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#636e72]">{emptyLabel}</p>
        ) : (
          <ul className="divide-y divide-[#ebe4d9]/60">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onItemClick(item.id)}
                  className={`flex w-full gap-3 px-3 py-3 text-left transition hover:bg-[#b9d9eb]/20 ${
                    item.read ? "opacity-80" : "bg-[#f5f0e6]/50"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.read ? "bg-[#ebe4d9]" : dotClass
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#2d3436]">{item.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#636e72]">
                      {item.body}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-[#5a8faf]">
                      {item.time}
                      {timeSuffix}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-[#ebe4d9]/80 bg-[#faf7f0]/80 px-2 py-2 space-y-1">
        {items.length > 0 && unread > 0 ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="w-full rounded-xl py-2 text-center text-xs font-bold text-[#5a8faf] transition hover:bg-[#b9d9eb]/30 hover:text-[#2d3436]"
          >
            {markAllLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onReadMore}
          className="w-full rounded-xl py-2 text-center text-xs font-semibold text-[#2d3436] transition hover:bg-[#cde8cf]/40"
        >
          {readMoreLabel}
        </button>
      </div>
    </div>
  );
}
