import { SchoolExpensesPanel } from "./SchoolExpensesPanel";
import { useI18n } from "../../i18n/I18nProvider";

export function ExpensesAllPage() {
  const { t } = useI18n();
  return (
    <div className="min-w-0 space-y-4">
      <header className="border-b border-[#ebe4d9]/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[#2d3436]">{t("expenses.allTitle")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#636e72]">
          {t("expenses.pageIntro")}
        </p>
      </header>
      <SchoolExpensesPanel limit={500} title={t("expenses.tableCaption")} />
    </div>
  );
}
