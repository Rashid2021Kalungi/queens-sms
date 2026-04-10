import { useState } from "react";
import { AdmissionImportTable } from "./AdmissionImportTable";
import { NewAdmissionForm } from "./NewAdmissionForm";
import { ParentsSectionPage } from "./ParentsSectionPage";
import { StudentsListPanel } from "./StudentsListPanel";
import { useI18n } from "../../i18n/I18nProvider";

export type StudentNavSection = "all" | "admissions" | "profiles" | "import" | "parents";

export function StudentsSectionPage({
  section,
  classNameFilter = null,
}: {
  section: StudentNavSection;
  classNameFilter?: string | null;
}) {
  const { t } = useI18n();
  const [listRefresh, setListRefresh] = useState(0);

  const titleKey =
    section === "admissions"
      ? "students.page.admissionsTitle"
      : section === "import"
        ? "students.page.importTitle"
      : section === "parents"
        ? "students.page.parentsTitle"
      : section === "profiles"
        ? "students.page.profilesTitle"
        : "students.page.allTitle";
  const introKey =
    section === "admissions"
      ? "students.page.introAdmissions"
      : section === "import"
        ? "students.page.introImport"
      : section === "parents"
        ? "students.page.introParents"
      : section === "profiles"
        ? "students.page.introProfiles"
        : "students.page.introAll";

  return (
    <div className="min-w-0 space-y-6">
      <header className="border-b border-[#ebe4d9]/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[#2d3436]">{t(titleKey)}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#636e72]">{t(introKey)}</p>
      </header>

      {section === "admissions" ? (
        <NewAdmissionForm onCreated={() => setListRefresh((k) => k + 1)} />
      ) : section === "import" ? (
        <AdmissionImportTable onDone={() => setListRefresh((k) => k + 1)} />
      ) : section === "parents" ? (
        <ParentsSectionPage />
      ) : (
        <StudentsListPanel
          limit={500}
          showDirectoryTools
          refreshKey={listRefresh}
          classNameFilter={classNameFilter}
          title=""
        />
      )}
    </div>
  );
}
