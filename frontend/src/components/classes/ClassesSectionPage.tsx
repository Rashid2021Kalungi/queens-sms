import { useEffect, useMemo, useState } from "react";
import {
  createClassCategory,
  createClassSection,
  createClassroom,
  deleteClassCategory,
  deleteClassSection,
  deleteClassroom,
  disableClassroom,
  fetchClassCategories,
  fetchClassrooms,
  fetchClassSections,
  fetchStudents,
  updateClassCategory,
  updateClassSection,
  updateClassroom,
  type ClassCategoryOption,
  type ClassRoomOption,
  type ClassSectionOption,
  type StudentApiRow,
} from "../../api/students";
import { useI18n } from "../../i18n/I18nProvider";

export type ClassesSection =
  | "all_classes"
  | "sections_streams"
  | "class_students"
  | "class_teachers"
  | "class_categories"
  | "class_reports";

type Props = {
  section: ClassesSection;
};

const cardClass = "rounded-2xl border border-[#ebe4d9] bg-[#fffcf7] p-5 shadow-[6px_8px_24px_rgba(45,52,54,0.08)]";
const inputClass = "w-full rounded-lg border border-[#e0d8cc] bg-white px-3 py-2 text-sm outline-none focus:border-[#6a9570]/70";

function IconBtn({
  danger,
  label,
  onClick,
  icon,
}: {
  danger?: boolean;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${
        danger
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "border-[#d7d0c3] bg-[#fffdf9] text-[#5a8faf] hover:bg-[#f2f7fb]"
      }`}
    >
      {icon}
    </button>
  );
}

export function ClassesSectionPage({ section }: Props) {
  const { t } = useI18n();
  const [rooms, setRooms] = useState<ClassRoomOption[]>([]);
  const [categories, setCategories] = useState<ClassCategoryOption[]>([]);
  const [sections, setSections] = useState<ClassSectionOption[]>([]);
  const [students, setStudents] = useState<StudentApiRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [className, setClassName] = useState<string>("");
  const [classDesc, setClassDesc] = useState<string>("");
  const [classCategoryId, setClassCategoryId] = useState<string>("");
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [classFilterCategoryId, setClassFilterCategoryId] = useState<string>("");
  const [sectionFilterClassId, setSectionFilterClassId] = useState<string>("");
  const [classRoomId, setClassRoomId] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [sectionTeacher, setSectionTeacher] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editClassId, setEditClassId] = useState<number | null>(null);
  const [editSectionId, setEditSectionId] = useState<number | null>(null);
  const [studentClassFilter, setStudentClassFilter] = useState<string>("");
  const [studentSectionFilter, setStudentSectionFilter] = useState<string>("");
  const [reportClassId, setReportClassId] = useState<string>("");
  const [reportTerm, setReportTerm] = useState<string>("");
  const [reportType, setReportType] = useState<"PDF" | "Excel">("PDF");

  const classesViewRows = useMemo(() => {
    const filtered = classFilterCategoryId
      ? rooms.filter((x) => x.categoryId === Number(classFilterCategoryId))
      : rooms;
    return filtered.map((room) => {
      const sectionCount = sections.filter((x) => x.classRoomId === room.id).length;
      const totalStudents = students.filter((x) => x.classRoomId === room.id).length;
      return { room, sectionCount, totalStudents };
    });
  }, [classFilterCategoryId, rooms, sections, students]);

  const studentsViewRows = useMemo(() => {
    return students.filter((s) => {
      if (studentClassFilter && s.classRoomId !== Number(studentClassFilter)) return false;
      if (studentSectionFilter && s.sectionName !== studentSectionFilter) return false;
      return true;
    });
  }, [studentClassFilter, studentSectionFilter, students]);

  const sectionsViewRows = useMemo(() => {
    const id = Number.parseInt(sectionFilterClassId, 10);
    const list =
      Number.isFinite(id) && id >= 1 ? sections.filter((x) => x.classRoomId === id) : sections;
    return list.map((sec) => {
      const room = rooms.find((r) => r.id === sec.classRoomId);
      const studentCount = students.filter(
        (st) =>
          st.classRoomId === sec.classRoomId &&
          (st.sectionName ?? "").trim() === sec.name.trim(),
      ).length;
      return { sec, room, studentCount };
    });
  }, [sectionFilterClassId, sections, rooms, students]);

  const loadDbData = async () => {
    setLoading(true);
    try {
      const [roomRows, categoryRows, sectionRows, studentRows] = await Promise.all([
        fetchClassrooms(),
        fetchClassCategories(),
        fetchClassSections(),
        fetchStudents({ limit: 500 }),
      ]);
      setRooms(roomRows);
      setCategories(categoryRows);
      setSections(sectionRows);
      setStudents(studentRows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load classes/sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDbData();
  }, []);

  useEffect(() => {
    if (section !== "sections_streams") {
      setShowAddSectionForm(false);
      setEditSectionId(null);
      setSectionName("");
      setSectionTeacher("");
      setClassRoomId("");
    }
    if (section !== "class_categories") {
      setShowAddCategoryForm(false);
      setEditCategoryId(null);
      setCategoryName("");
      setCategoryDesc("");
    }
  }, [section]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const categoryId = Number.parseInt(classCategoryId, 10);
    if (!className.trim()) {
      setError("Class name cannot be empty.");
      return;
    }
    if (!Number.isFinite(categoryId)) {
      setError("Please select a class category.");
      return;
    }
    try {
      await createClassroom({
        name: className.trim(),
        categoryId,
        description: classDesc.trim() || undefined,
      });
      setClassName("");
      setClassDesc("");
      setClassCategoryId("");
      setShowAddClassForm(false);
      await loadDbData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class");
    }
  };

  const confirmDelete = (entity: "class" | "section" | "category"): boolean => {
    const label = entity === "class" ? "class" : entity === "section" ? "section" : "category";
    return window.confirm(`Are you sure you want to delete this ${label}? This action cannot be undone.`);
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = Number.parseInt(classRoomId, 10);
    if (!Number.isFinite(id) || id < 1) {
      setError("Please select a class before adding a section.");
      return;
    }
    if (!sectionName.trim()) {
      setError("Section name cannot be empty.");
      return;
    }
    try {
      if (editSectionId) {
        await updateClassSection(editSectionId, {
          classRoomId: id,
          name: sectionName.trim(),
          classTeacherName: sectionTeacher.trim() || undefined,
        });
      } else {
        await createClassSection({
          classRoomId: id,
          name: sectionName.trim(),
          classTeacherName: sectionTeacher.trim() || undefined,
        });
      }
      setSectionName("");
      setSectionTeacher("");
      setEditSectionId(null);
      setShowAddSectionForm(false);
      await loadDbData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save section");
    }
  };

  const handleSaveCategory = async (id?: number) => {
    if (!categoryName.trim()) {
      setError("Category name cannot be empty.");
      return;
    }
    try {
      if (id) await updateClassCategory(id, { name: categoryName.trim(), description: categoryDesc.trim() || undefined });
      else await createClassCategory({ name: categoryName.trim(), description: categoryDesc.trim() || undefined });
      setEditCategoryId(null);
      setCategoryName("");
      setCategoryDesc("");
      setShowAddCategoryForm(false);
      await loadDbData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    }
  };

  const handleCategoryFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSaveCategory(editCategoryId ?? undefined);
  };

  const closeCategoryForm = () => {
    setShowAddCategoryForm(false);
    setEditCategoryId(null);
    setCategoryName("");
    setCategoryDesc("");
  };

  const titleKey =
    section === "sections_streams"
      ? "classes.page.sectionsStreamsTitle"
      : section === "class_students"
        ? "classes.page.classStudentsTitle"
        : section === "class_teachers"
          ? "classes.page.classTeachersTitle"
          : section === "class_categories"
            ? "classes.page.classCategoriesTitle"
          : section === "class_reports"
            ? "classes.page.classReportsTitle"
            : "classes.page.allClassesTitle";

  const introKey =
    section === "sections_streams"
      ? "classes.page.sectionsStreamsIntro"
      : section === "class_students"
        ? "classes.page.classStudentsIntro"
        : section === "class_teachers"
          ? "classes.page.classTeachersIntro"
          : section === "class_categories"
            ? "classes.page.classCategoriesIntro"
          : section === "class_reports"
            ? "classes.page.classReportsIntro"
            : "classes.page.allClassesIntro";

  return (
    <div className="min-w-0 space-y-6">
      {error ? (
        <div className="fixed inset-0 z-[70] bg-[#2d3436]/45 backdrop-blur-[1px]">
          <div className="absolute left-1/2 top-6 w-[min(92vw,520px)] -translate-x-1/2 rounded-xl border border-rose-200 bg-white p-3 shadow-[0_18px_40px_rgba(45,52,54,0.35)]">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-rose-700">{error}</p>
              <button
                type="button"
                aria-label="Dismiss error"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50"
                onClick={() => setError(null)}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddClassForm ? (
        <div className="fixed inset-0 z-40 bg-[#2d3436]/30 backdrop-blur-[2px]">
          <div className="mx-auto mt-14 w-[min(92vw,520px)] lg:ml-[calc(14rem+((100vw-14rem-520px)/2))]">
            <section className="rounded-2xl border border-[#ebe4d9] bg-[#fffdf9] p-5 shadow-[0_20px_50px_rgba(45,52,54,0.25)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#2d3436]">
                  {editClassId ? "Update Class" : "Add New Class"}
                </h2>
                <button
                  type="button"
                  aria-label="Close add class form"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#ddd3c4] bg-white text-[#636e72] hover:bg-[#f6f1e8]"
                  onClick={() => {
                    setShowAddClassForm(false);
                    setEditClassId(null);
                  }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <form
                onSubmit={
                  editClassId
                    ? async (e) => {
                        e.preventDefault();
                        if (!className.trim()) {
                          setError("Class name cannot be empty.");
                          return;
                        }
                        if (!classCategoryId) {
                          setError("Please select a class category.");
                          return;
                        }
                        try {
                          await updateClassroom(editClassId, {
                            name: className.trim(),
                            categoryId: Number(classCategoryId),
                            description: classDesc.trim() || undefined,
                          });
                          setEditClassId(null);
                          setClassName("");
                          setClassDesc("");
                          setClassCategoryId("");
                          setShowAddClassForm(false);
                          await loadDbData();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Failed to update class");
                        }
                      }
                    : handleCreateClass
                }
                className="mx-auto flex w-full max-w-[560px] flex-col gap-3"
              >
                <input value={className} onChange={(e) => setClassName(e.target.value)} className={inputClass} placeholder="Class name (required)" />
                <select value={classCategoryId} onChange={(e) => setClassCategoryId(e.target.value)} className={inputClass}>
                  <option value="">Category (required)</option>
                  {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
                <input value={classDesc} onChange={(e) => setClassDesc(e.target.value)} className={inputClass} placeholder="Description (optional)" />
                <button type="submit" className="rounded-lg bg-[#6a9570] px-3 py-2 text-sm font-semibold text-white">
                  {editClassId ? "Update class" : "Save class"}
                </button>
              </form>
            </section>
          </div>
        </div>
      ) : null}

      {section === "sections_streams" && showAddSectionForm ? (
        <div className="fixed inset-0 z-40 bg-[#2d3436]/30 backdrop-blur-[2px]">
          <div className="mx-auto mt-14 w-[min(92vw,520px)] lg:ml-[calc(14rem+((100vw-14rem-520px)/2))]">
            <section className="rounded-2xl border border-[#ebe4d9] bg-[#fffdf9] p-5 shadow-[0_20px_50px_rgba(45,52,54,0.25)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#2d3436]">
                  {editSectionId ? t("classes.sections.formEditTitle") : t("classes.sections.formAddTitle")}
                </h2>
                <button
                  type="button"
                  aria-label="Close add section form"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#ddd3c4] bg-white text-[#636e72] hover:bg-[#f6f1e8]"
                  onClick={() => {
                    setShowAddSectionForm(false);
                    setEditSectionId(null);
                    setSectionName("");
                    setSectionTeacher("");
                  }}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateSection} className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
                <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-[#636e72]">
                  {t("classes.sections.col.class")} *
                  <select
                    required
                    value={classRoomId}
                    onChange={(e) => setClassRoomId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t("classes.sections.selectClass")}</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.name} ({r.academicYear})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-[#636e72]">
                  {t("classes.sections.col.section")} *
                  <input
                    required
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className={inputClass}
                    placeholder={t("classes.sections.placeholderName")}
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-[#636e72]">
                  {t("classes.sections.col.teacher")}
                  <input
                    value={sectionTeacher}
                    onChange={(e) => setSectionTeacher(e.target.value)}
                    className={inputClass}
                    placeholder={t("classes.sections.placeholderTeacher")}
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-[#6a9570] px-3 py-2 text-sm font-semibold text-white"
                >
                  {editSectionId ? t("classes.sections.btnUpdate") : t("classes.sections.btnSave")}
                </button>
              </form>
            </section>
          </div>
        </div>
      ) : null}

      {section === "class_categories" && showAddCategoryForm ? (
        <div className="fixed inset-0 z-40 bg-[#2d3436]/35 backdrop-blur-[2px]">
          <div className="mx-auto mt-10 w-[min(92vw,480px)] sm:mt-14 lg:ml-[calc(14rem+((100vw-14rem-480px)/2))]">
            <section
              className="overflow-hidden rounded-2xl border border-[#ebe4d9] bg-[#fffdf9] shadow-[0_24px_56px_rgba(45,52,54,0.28)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="category-modal-title"
            >
              <div className="border-b border-[#ebe4d9] bg-gradient-to-r from-[#f8faf6] to-[#eef6f9] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 id="category-modal-title" className="text-lg font-bold tracking-tight text-[#2d3436]">
                      {editCategoryId ? t("classes.categories.formEditTitle") : t("classes.categories.formAddTitle")}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[#636e72]">{t("classes.categories.subtitle")}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={t("classes.categories.closeForm")}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#ddd3c4] bg-white text-[#636e72] shadow-sm transition hover:bg-[#f6f1e8]"
                    onClick={closeCategoryForm}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-5">
                <form onSubmit={handleCategoryFormSubmit} className="flex flex-col gap-4">
                  <label className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#636e72]">
                      {t("classes.categories.fieldName")} <span className="text-rose-600">*</span>
                    </span>
                    <input
                      required
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className={inputClass}
                      placeholder={t("classes.categories.placeholderName")}
                      autoComplete="off"
                    />
                  </label>
                  <label className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wide text-[#636e72]">
                      {t("classes.categories.fieldDescription")}
                    </span>
                    <input
                      value={categoryDesc}
                      onChange={(e) => setCategoryDesc(e.target.value)}
                      className={inputClass}
                      placeholder={t("classes.categories.placeholderDesc")}
                      autoComplete="off"
                    />
                  </label>
                  <div className="mt-1 flex flex-col-reverse gap-2 border-t border-[#f0ebe3] pt-4 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="rounded-xl border border-[#e0d8cc] bg-white px-4 py-2.5 text-sm font-semibold text-[#2d3436] shadow-sm transition hover:bg-[#faf7f0]"
                      onClick={closeCategoryForm}
                    >
                      {t("layout.profile.cancelAction")}
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-gradient-to-br from-[#6a9570] to-[#4a6b4e] px-4 py-2.5 text-sm font-bold text-white shadow-md ring-1 ring-[#5a855f]/25 transition hover:brightness-110"
                    >
                      {editCategoryId ? t("classes.categories.btnUpdate") : t("classes.categories.btnSave")}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      <header className="border-b border-[#ebe4d9]/80 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[#2d3436]">{t(titleKey)}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#636e72]">{t(introKey)}</p>
      </header>

      {loading ? <p className="text-sm text-[#636e72]">{t("students.form.sectionLoading")}</p> : null}

      {section === "all_classes" ? (
        <section className={cardClass}>
          <div className="flex w-full flex-wrap items-end justify-end gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="classes-filter-category" className="text-[10px] font-bold uppercase tracking-wide text-[#636e72]">
                {t("toolbar.filter")}
              </label>
              <select
                id="classes-filter-category"
                value={classFilterCategoryId}
                onChange={(e) => setClassFilterCategoryId(e.target.value)}
                className={`${inputClass} min-w-[min(100%,200px)] max-w-[280px] sm:w-[240px]`}
                aria-label={t("classes.filter.categoryAria")}
              >
                <option value="">{t("classes.filter.allCategories")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              aria-label={t("classes.action.addClass")}
              title={t("classes.action.addClass")}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6a9570] to-[#4a6b4e] text-white shadow-md ring-1 ring-[#5a855f]/30 transition hover:brightness-110 active:translate-y-px"
              onClick={() => setShowAddClassForm((v) => !v)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden>
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-[#636e72]">
                <tr><th>Class name</th><th>Section count</th><th>Total students</th><th>Category</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {classesViewRows.map(({ room, sectionCount, totalStudents }) => (
                  <tr key={room.id} className="border-t border-[#ebe4d9]">
                    <td className="py-2 font-semibold">
                      {room.name}
                      {room.isActive === false ? (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          Disabled
                        </span>
                      ) : null}
                    </td>
                    <td>{sectionCount}</td>
                    <td>{totalStudents}</td>
                    <td>{room.categoryName ?? "-"}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <IconBtn
                          label="Edit class"
                          onClick={() => {
                            setEditClassId(room.id);
                            setClassName(room.name);
                            setClassDesc(room.description ?? "");
                            setClassCategoryId(room.categoryId ? String(room.categoryId) : "");
                            setShowAddClassForm(true);
                          }}
                          icon={
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                              <path stroke="currentColor" strokeWidth="1.8" d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4" />
                            </svg>
                          }
                        />
                        <IconBtn
                          danger
                          label="Delete class"
                          onClick={async () => {
                            if (!confirmDelete("class")) return;
                            try {
                              await deleteClassroom(room.id);
                              await loadDbData();
                            } catch (err) {
                              const msg = err instanceof Error ? err.message : "Delete failed";
                              if (/cannot be deleted|disable it instead|allocated/i.test(msg)) {
                                const disableNow = window.confirm(
                                  "This class has allocated students and cannot be deleted. Disable it instead?",
                                );
                                if (disableNow) {
                                  await disableClassroom(room.id);
                                  await loadDbData();
                                  return;
                                }
                              }
                              setError(msg);
                            }
                          }}
                          icon={
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                              <path stroke="currentColor" strokeWidth="1.8" d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V5h6v2" />
                            </svg>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {section === "sections_streams" ? (
        <section className={cardClass}>
          <div className="flex w-full flex-wrap items-end justify-end gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="sections-filter-class" className="text-[10px] font-bold uppercase tracking-wide text-[#636e72]">
                {t("toolbar.filter")}
              </label>
              <select
                id="sections-filter-class"
                value={sectionFilterClassId}
                onChange={(e) => setSectionFilterClassId(e.target.value)}
                className={`${inputClass} min-w-[min(100%,200px)] max-w-[280px] sm:w-[240px]`}
                aria-label={t("classes.filter.byClassAria")}
              >
                <option value="">{t("classes.filter.classAll")}</option>
                {rooms.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name} ({r.academicYear})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              aria-label={t("classes.action.addSection")}
              title={t("classes.action.addSection")}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6a9570] to-[#4a6b4e] text-white shadow-md ring-1 ring-[#5a855f]/30 transition hover:brightness-110 active:translate-y-px"
              onClick={() => {
                setEditSectionId(null);
                setSectionName("");
                setSectionTeacher("");
                setClassRoomId(sectionFilterClassId.trim() ? sectionFilterClassId : "");
                setShowAddSectionForm(true);
              }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden>
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          <div className="mt-4 min-w-0 overflow-hidden">
            <table className="table-fixed w-full text-left text-sm">
              <thead className="border-b border-[#ebe4d9] text-left text-[10px] font-bold uppercase tracking-wide text-[#636e72] sm:text-[11px]">
                <tr>
                  <th className="min-w-0 py-2 pr-2">{t("classes.sections.col.section")}</th>
                  <th className="min-w-0 py-2 pr-2">{t("classes.sections.col.class")}</th>
                  <th className="hidden min-w-0 py-2 pr-2 sm:table-cell">{t("classes.sections.col.category")}</th>
                  <th className="w-16 py-2 pr-2 text-center tabular-nums sm:w-20">{t("classes.sections.col.students")}</th>
                  <th className="hidden min-w-0 py-2 pr-2 md:table-cell">{t("classes.sections.col.teacher")}</th>
                  <th className="w-20 py-2 text-right sm:w-24">{t("students.col.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ebe3]">
                {sectionsViewRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-[#636e72]">
                      {rooms.length === 0 ? t("classes.sections.emptyNeedClasses") : t("classes.sections.emptyFiltered")}
                    </td>
                  </tr>
                ) : (
                  sectionsViewRows.map(({ sec, room, studentCount }) => (
                    <tr key={sec.id} className="transition-colors hover:bg-[#f0f7f4]/90">
                      <td className="min-w-0 truncate py-2 pr-2 font-semibold text-[#2d3436]">{sec.name}</td>
                      <td className="min-w-0 truncate py-2 pr-2 text-[#2d3436]">{room?.name ?? "—"}</td>
                      <td className="hidden min-w-0 truncate py-2 pr-2 text-[#636e72] sm:table-cell">
                        {room?.categoryName ?? "—"}
                      </td>
                      <td className="py-2 pr-2 text-center tabular-nums text-[#2d3436]">{studentCount}</td>
                      <td className="hidden min-w-0 truncate py-2 pr-2 text-[#636e72] md:table-cell">
                        {sec.classTeacherName ?? "—"}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn
                            label="Edit section"
                            onClick={() => {
                              setEditSectionId(sec.id);
                              setSectionName(sec.name);
                              setSectionTeacher(sec.classTeacherName ?? "");
                              setClassRoomId(String(sec.classRoomId));
                              setShowAddSectionForm(true);
                            }}
                            icon={
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                                <path stroke="currentColor" strokeWidth="1.8" d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4" />
                              </svg>
                            }
                          />
                          <IconBtn
                            danger
                            label="Delete section"
                            onClick={async () => {
                              if (!confirmDelete("section")) return;
                              try {
                                await deleteClassSection(sec.id);
                                if (editSectionId === sec.id) {
                                  setEditSectionId(null);
                                  setSectionName("");
                                  setSectionTeacher("");
                                  setShowAddSectionForm(false);
                                }
                                await loadDbData();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Delete failed");
                              }
                            }}
                            icon={
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                                <path stroke="currentColor" strokeWidth="1.8" d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V5h6v2" />
                              </svg>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {section === "class_students" ? (
        <section className={cardClass}>
          <h2 className="text-base font-bold text-[#2d3436]">Class Students</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <select value={studentClassFilter} onChange={(e) => setStudentClassFilter(e.target.value)} className={inputClass}>
              <option value="">Filter by class</option>
              {rooms.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
            </select>
            <select value={studentSectionFilter} onChange={(e) => setStudentSectionFilter(e.target.value)} className={inputClass}>
              <option value="">Filter by Section</option>
              {sections.filter((x) => !studentClassFilter || x.classRoomId === Number(studentClassFilter)).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <div className="rounded-lg border border-dashed border-[#d9cfbf] bg-[#fffaf2] px-3 py-2 text-xs text-[#636e72]">Bulk upload (Excel) can continue via admissions import.</div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-[#636e72]"><tr><th>Name</th><th>Class</th><th>Section</th><th>Action</th></tr></thead>
              <tbody>{studentsViewRows.map((s) => <tr key={s.id} className="border-t border-[#ebe4d9]"><td className="py-2">{s.fullName}</td><td>{s.className ?? "-"}</td><td>{s.sectionName ?? "-"}</td><td><span className="text-[#5a8faf]">Move section (edit student)</span></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      ) : null}

      {section === "class_teachers" ? (
        <section className={cardClass}>
          <h2 className="text-base font-bold text-[#2d3436]">Class Teachers</h2>
          <p className="mt-2 text-sm text-[#636e72]">Assign teachers at section level.</p>
          <div className="mt-3 grid gap-2">{sections.map((s) => (
            <div key={s.id} className="rounded-lg border border-[#ebe4d9] bg-white p-3 text-sm">
              <div className="font-semibold">{rooms.find((r) => r.id === s.classRoomId)?.name} - {s.name}</div>
              <div className="mt-1 text-[#636e72]">{s.classTeacherName ?? "Unassigned"}</div>
            </div>
          ))}</div>
        </section>
      ) : null}

      {section === "class_categories" ? (
        <section className={cardClass}>
          <div className="flex w-full flex-wrap items-end justify-end gap-3">
            <button
              type="button"
              aria-label={t("classes.action.addCategory")}
              title={t("classes.action.addCategory")}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6a9570] to-[#4a6b4e] text-white shadow-md ring-1 ring-[#5a855f]/30 transition hover:brightness-110 active:translate-y-px"
              onClick={() => {
                setEditCategoryId(null);
                setCategoryName("");
                setCategoryDesc("");
                setShowAddCategoryForm(true);
              }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden>
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <div className="mt-4 min-w-0 overflow-hidden">
            <table className="table-fixed w-full text-sm">
              <thead className="border-b border-[#ebe4d9] text-left text-[10px] font-bold uppercase tracking-wide text-[#636e72] sm:text-[11px]">
                <tr>
                  <th className="min-w-0 py-2 pr-2">Category</th>
                  <th className="hidden min-w-0 py-2 pr-2 sm:table-cell">Description</th>
                  <th className="w-20 py-2 pr-2 text-center sm:w-24">Classes</th>
                  <th className="w-24 py-2 text-right sm:w-28">{t("students.col.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ebe3]">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-sm text-[#636e72]">
                      {t("classes.categories.empty")}
                    </td>
                  </tr>
                ) : null}
                {categories.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-[#f0f7f4]/90">
                    <td className="min-w-0 truncate py-2 pr-2 font-semibold text-[#2d3436]">{c.name}</td>
                    <td className="hidden min-w-0 truncate py-2 pr-2 text-[#636e72] sm:table-cell">
                      {c.description ?? "—"}
                    </td>
                    <td className="py-2 pr-2 text-center tabular-nums text-[#2d3436]">{c.classesCount ?? 0}</td>
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn
                          label="Edit category"
                          onClick={() => {
                            setEditCategoryId(c.id);
                            setCategoryName(c.name);
                            setCategoryDesc(c.description ?? "");
                            setShowAddCategoryForm(true);
                          }}
                          icon={
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                              <path stroke="currentColor" strokeWidth="1.8" d="M4 20h4l10-10-4-4L4 16v4zM13 7l4 4" />
                            </svg>
                          }
                        />
                        <IconBtn
                          danger
                          label="Delete category"
                          onClick={async () => {
                            try {
                              if (!confirmDelete("category")) return;
                              await deleteClassCategory(c.id);
                              if (editCategoryId === c.id) closeCategoryForm();
                              await loadDbData();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Delete failed");
                            }
                          }}
                          icon={
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden>
                              <path stroke="currentColor" strokeWidth="1.8" d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V5h6v2" />
                            </svg>
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {section === "class_reports" ? (
        <section className={cardClass}>
          <h2 className="text-base font-bold text-[#2d3436]">Class Reports</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <select value={reportClassId} onChange={(e) => setReportClassId(e.target.value)} className={inputClass}>
              <option value="">Select class</option>
              {rooms.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
            </select>
            <input value={reportTerm} onChange={(e) => setReportTerm(e.target.value)} className={inputClass} placeholder="Select Term (optional)" />
            <select value={reportType} onChange={(e) => setReportType(e.target.value as "PDF" | "Excel")} className={inputClass}>
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
            </select>
          </div>
          <div className="mt-3 rounded-lg bg-[#f5f0e6] px-3 py-2 text-sm text-[#636e72]">
            Ready to generate: class list, student count, and performance summary ({reportType}).
          </div>
        </section>
      ) : null}

      <div />
    </div>
  );
}
