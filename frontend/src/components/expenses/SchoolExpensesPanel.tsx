import { useEffect, useState } from "react";
import {
  fetchExpenses,
  type ExpenseSortBy,
  type ExpenseSortDir,
} from "../../api/expenses";
import type { DashboardExpenseRow } from "../../api/dashboard";
import { useI18n } from "../../i18n/I18nProvider";

const selectClass =
  "neo-inset-field min-w-[8.5rem] px-2 py-1.5 text-sm text-[#2d3436]";

type SchoolExpensesPanelProps = {
  limit: number;
  title: string;
  showShowAll?: boolean;
  onShowAll?: () => void;
};

export function SchoolExpensesPanel({
  limit,
  title,
  showShowAll,
  onShowAll,
}: SchoolExpensesPanelProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const [applied, setApplied] = useState("");
  const [sortBy, setSortBy] = useState<ExpenseSortBy>("date");
  const [sortDir, setSortDir] = useState<ExpenseSortDir>("desc");
  const [items, setItems] = useState<DashboardExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchExpenses({ q: applied, sortBy, sortDir, limit })
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applied, sortBy, sortDir, limit]);

  const runSearch = () => {
    setApplied(draft.trim());
  };

  return (
    <section className="neo-card-elevated overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#ebe4d9] bg-gradient-to-r from-[#f8f9f6] to-[#eef6f9] px-5 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <h2 className="shrink-0 font-semibold text-[#2d3436]">{title}</h2>
        <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-md">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#636e72]">
              {t("toolbar.filter")}
            </span>
            <label className="sr-only" htmlFor="expense-search">
              {t("dashboard.expense.searchLabel")}
            </label>
            <input
              id="expense-search"
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              placeholder={t("dashboard.expense.searchPlaceholder")}
              className="neo-inset-field min-w-0 w-full px-3 py-1.5 text-sm text-[#2d3436] placeholder:text-[#636e72]/70"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#636e72]">
              {t("toolbar.sort")}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="expense-sort-by">
                {t("dashboard.expense.sortBy")}
              </label>
              <select
                id="expense-sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ExpenseSortBy)}
                className={selectClass}
              >
                <option value="date">{t("dashboard.expense.sort.date")}</option>
                <option value="id">{t("dashboard.expense.sort.id")}</option>
                <option value="status">{t("dashboard.expense.sort.status")}</option>
              </select>
              <label className="sr-only" htmlFor="expense-sort-dir">
                {t("dashboard.expense.sortDirection")}
              </label>
              <select
                id="expense-sort-dir"
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as ExpenseSortDir)}
                className={selectClass}
              >
                <option value="desc">{t("dashboard.expense.sort.za")}</option>
                <option value="asc">{t("dashboard.expense.sort.az")}</option>
              </select>
              <button
                type="button"
                onClick={runSearch}
                className="rounded-full bg-gradient-to-br from-[#b8d8ba] to-[#8fb892] px-5 py-1.5 text-sm font-bold text-[#2d3436] shadow-[3px_3px_8px_rgba(120,150,125,0.35),-2px_-2px_6px_rgba(255,255,255,0.85)] transition hover:brightness-105"
              >
                {t("dashboard.search")}
              </button>
              {showShowAll && onShowAll ? (
                <button
                  type="button"
                  onClick={onShowAll}
                  className="rounded-full bg-gradient-to-br from-[#faf7f0] to-[#ebe4d9] px-4 py-1.5 text-sm font-semibold text-[#2d3436] shadow-[2px_2px_6px_rgba(200,188,170,0.35),-1px_-1px_5px_rgba(255,255,255,0.85)] transition hover:text-[#5a8faf]"
                >
                  {t("expenses.showAll")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {error ? (
        <p className="border-b border-[#ebe4d9] px-5 py-3 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
      <div className="min-w-0 overflow-hidden">
        <table className="table-fixed w-full text-left text-sm">
          <thead className="border-b border-[#ebe4d9] bg-[#faf7f0] text-[10px] font-bold uppercase text-[#636e72] sm:text-xs">
            <tr>
              <th className="w-[10%] px-2 py-3 sm:px-4">{t("dashboard.expense.id")}</th>
              <th className="w-[18%] px-2 py-3 sm:px-4">{t("dashboard.expense.type")}</th>
              <th className="w-[14%] px-2 py-3 sm:px-4">{t("dashboard.expense.amount")}</th>
              <th className="w-[14%] px-2 py-3 sm:px-4">{t("dashboard.expense.status")}</th>
              <th className="min-w-0 px-2 py-3 sm:px-4">{t("dashboard.expense.email")}</th>
              <th className="w-[16%] px-2 py-3 sm:px-4">{t("dashboard.expense.date")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#636e72]">
                  {t("expenses.loading")}
                </td>
              </tr>
            ) : null}
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-center text-sm text-[#636e72]">
                  {applied
                    ? t("dashboard.expense.noMatches")
                    : t("dashboard.noExpenses")}
                </td>
              </tr>
            ) : null}
            {!loading
              ? items.map((row) => (
                  <tr key={row.id} className="transition hover:bg-[#b9d9eb]/15">
                    <td className="min-w-0 truncate px-2 py-3 font-mono text-[10px] text-[#636e72] sm:px-4 sm:text-xs">
                      {row.id}
                    </td>
                    <td className="min-w-0 truncate px-2 py-3 text-xs text-[#2d3436] sm:px-4 sm:text-sm">
                      {row.type}
                    </td>
                    <td className="min-w-0 truncate px-2 py-3 text-xs font-semibold text-[#2d3436] sm:px-4 sm:text-sm">
                      {row.amount}
                    </td>
                    <td className="min-w-0 px-2 py-3 sm:px-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          row.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {row.status === "Paid"
                          ? t("dashboard.status.paid")
                          : t("dashboard.status.due")}
                      </span>
                    </td>
                    <td className="min-w-0 truncate px-2 py-3 text-xs text-[#636e72] sm:px-4 sm:text-sm">
                      {row.email}
                    </td>
                    <td className="min-w-0 truncate px-2 py-3 text-xs text-[#636e72] sm:px-4 sm:text-sm">
                      {row.date}
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
