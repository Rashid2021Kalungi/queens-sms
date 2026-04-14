import { useI18n } from "../../i18n/I18nProvider";
import { useTheme, type Density, type ThemePreference } from "../../theme/ThemeProvider";

const optionBtn =
  "rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sky)]/60";

export function SettingsModesPanel() {
  const { t } = useI18n();
  const {
    themePreference,
    setThemePreference,
    resolvedTheme,
    density,
    setDensity,
  } = useTheme();

  return (
    <div className="mx-auto max-w-lg">
      <div className="neo-card-elevated p-6 sm:p-8">
        <h1 className="text-xl font-bold text-[#2d3436]">{t("settings.modes.title")}</h1>
        <p className="mt-2 text-sm text-[#636e72]">{t("settings.modes.subtitle")}</p>

        <section className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#636e72]">
            {t("settings.modes.theme")}
          </h2>
          <p className="mt-1 text-xs text-[#636e72]/90">
            {t("settings.modes.themeHint")}
            {themePreference === "system" ? (
              <span className="mt-1 block font-medium text-[#5a8faf]">
                {t("settings.modes.resolved")}{" "}
                {resolvedTheme === "dark"
                  ? t("settings.modes.themeDark")
                  : t("settings.modes.themeLight")}
              </span>
            ) : null}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(
              [
                { id: "light" as const, labelKey: "settings.modes.themeLight" },
                { id: "dark" as const, labelKey: "settings.modes.themeDark" },
                { id: "system" as const, labelKey: "settings.modes.themeSystem" },
              ] satisfies { id: ThemePreference; labelKey: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setThemePreference(opt.id)}
                className={`${optionBtn} ${
                  themePreference === opt.id
                    ? "border-[#6a9570] bg-gradient-to-br from-[#cde8cf]/80 to-[#b8d8ba]/50 text-[#2d3436] shadow-[3px_3px_8px_rgba(120,150,125,0.35)]"
                    : "border-[#ebe4d9]/90 bg-[#faf7f0]/60 text-[#636e72] hover:border-[#b9d9eb]/80"
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 border-t border-[#ebe4d9]/80 pt-8">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#636e72]">
            {t("settings.modes.density")}
          </h2>
          <p className="mt-1 text-xs text-[#636e72]/90">{t("settings.modes.densityHint")}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                { id: "comfortable" as const, labelKey: "settings.modes.densityComfortable" },
                { id: "compact" as const, labelKey: "settings.modes.densityCompact" },
              ] satisfies { id: Density; labelKey: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDensity(opt.id)}
                className={`${optionBtn} ${
                  density === opt.id
                    ? "border-[#5a8faf] bg-gradient-to-br from-[#d4e8f5]/80 to-[#b9d9eb]/40 text-[#2d3436] shadow-[3px_3px_8px_rgba(90,143,175,0.3)]"
                    : "border-[#ebe4d9]/90 bg-[#faf7f0]/60 text-[#636e72] hover:border-[#b9d9eb]/80"
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
