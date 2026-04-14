import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
  fetchTeachers,
  updateClassCategory,
  updateClassSection,
  updateClassroom,
  type ClassCategoryOption,
  type ClassRoomOption,
  type ClassSectionOption,
  type StudentApiRow,
  type TeacherOption,
} from "../../api/students";
import { useI18n } from "../../i18n/I18nProvider";
import { StudentDetailModal } from "../students/StudentDetailModal";

export type ClassesSection =
  | "all_classes"
  | "sections_streams"
  | "class_students"
  | "class_students_roster"
  | "class_teachers"
  | "class_categories"
  | "class_reports";

type Props = {
  section: ClassesSection;
  /** When `section === "class_students_roster"`, which class roster to show. */
  rosterClassId?: number | null;
  onOpenClassRoster?: (classId: number) => void;
  onCloseClassRoster?: () => void;
};

const cardClass = "rounded-2xl border border-[#ebe4d9] bg-[#fffcf7] p-5 shadow-[6px_8px_24px_rgba(45,52,54,0.08)]";
const inputClass = "w-full rounded-lg border border-[#e0d8cc] bg-white px-3 py-2 text-sm outline-none focus:border-[#6a9570]/70";
const rosterMoveSectionBtn =
  "inline-flex items-center justify-center rounded-lg border border-[#d7e8ef] bg-gradient-to-br from-[#f2f7fb] to-[#e8f2f8] px-2.5 py-1.5 text-xs font-semibold text-[#2d5470] shadow-sm ring-1 ring-[#c5dce8]/40 transition hover:border-[#8bb8d4] hover:text-[#1a3d52] active:translate-y-px";

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

export function ClassesSectionPage({
  section,
  rosterClassId = null,
  onOpenClassRoster,
  onCloseClassRoster,
}: Props) {
  const { t } = useI18n();
  const [rooms, setRooms] = useState<ClassRoomOption[]>([]);
  const [categories, setCategories] = useState<ClassCategoryOption[]>([]);
  const [sections, setSections] = useState<ClassSectionOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
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
  const [rosterSectionFilter, setRosterSectionFilter] = useState<string>("");
  const [rosterSortBy, setRosterSortBy] = useState<"name" | "stream">("name");
  const [rosterSortDir, setRosterSortDir] = useState<"asc" | "desc">("asc");
  const [reportClassId, setReportClassId] = useState<string>("");
  const [reportTerm, setReportTerm] = useState<string>("");
  const [reportType, setReportType] = useState<"PDF" | "Excel">("PDF");
  const [rosterStudentModal, setRosterStudentModal] = useState<{
    studentId: number;
    focusSection: boolean;
  } | null>(null);

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

  const classStudentsSummaryRows = useMemo(() => {
    return rooms.map((room) => {
      const classSecs = sections.filter((x) => x.classRoomId === room.id);
      const streamCounts = classSecs.map((sec) => {
        const count = students.filter(
          (st) =>
            st.classRoomId === room.id && (st.sectionName ?? "").trim() === sec.name.trim(),
        ).length;
        return { name: sec.name, count };
      });
      const totalInClass = students.filter((st) => st.classRoomId === room.id).length;
      return { room, streamCounts, totalInClass };
    });
  }, [rooms, sections, students]);

  const classRosterRows = useMemo(() => {
    if (rosterClassId == null || rosterClassId < 1) return [];
    const filtered = students.filter((s) => {
      if (s.classRoomId !== rosterClassId) return false;
      if (rosterSectionFilter && s.sectionName !== rosterSectionFilter) return false;
      return true;
    });
    const collator = new Intl.Collator(undefined, { sensitivity: "base" });
    return [...filtered].sort((a, b) => {
      if (rosterSortBy === "name") {
        const c = collator.compare(a.fullName, b.fullName);
        return rosterSortDir === "asc" ? c : -c;
      }
      const sa = (a.sectionName ?? "").trim() || "\uffff";
      const sb = (b.sectionName ?? "").trim() || "\uffff";
      const c = collator.compare(sa, sb);
      return rosterSortDir === "asc" ? c : -c;
    });
  }, [rosterClassId, rosterSectionFilter, students, rosterSortBy, rosterSortDir]);

  const rosterRoom = useMemo(
    () => (rosterClassId != null && rosterClassId >= 1 ? rooms.find((r) => r.id === rosterClassId) ?? null : null),
    [rooms, rosterClassId],
  );

  const rosterStreamNames = useMemo(() => {
    if (rosterClassId == null || rosterClassId < 1) return [];
    const names = sections
      .filter((x) => x.classRoomId === rosterClassId)
      .map((x) => x.name.trim())
      .filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [sections, rosterClassId]);

  const selectedReportRoom = useMemo(() => {
    const id = Number.parseInt(reportClassId, 10);
    if (!Number.isFinite(id) || id < 1) return null;
    return rooms.find((r) => r.id === id) ?? null;
  }, [reportClassId, rooms]);

  const reportStats = useMemo(() => {
    if (!selectedReportRoom) return { students: 0, streams: 0 };
    const studentsInClass = students.filter((s) => s.classRoomId === selectedReportRoom.id).length;
    const streamsInClass = sections.filter((s) => s.classRoomId === selectedReportRoom.id).length;
    return { students: studentsInClass, streams: streamsInClass };
  }, [selectedReportRoom, students, sections]);

  const reportRows = useMemo(() => {
    if (!selectedReportRoom) return [];
    const collator = new Intl.Collator(undefined, { sensitivity: "base" });
    return students
      .filter((s) => s.classRoomId === selectedReportRoom.id)
      .slice()
      .sort((a, b) => collator.compare(a.fullName, b.fullName));
  }, [selectedReportRoom, students]);

  const handleGenerateReport = async () => {
    if (!selectedReportRoom) return;
    const className = selectedReportRoom.name;
    const term = reportTerm.trim() || t("classes.reports.termAny");
    const stamp = new Date().toISOString().slice(0, 10);

    if (reportType === "Excel") {
      const wb = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.json_to_sheet([
        {
          Class: className,
          Term: term,
          Students: reportStats.students,
          Streams: reportStats.streams,
        },
      ]);
      const studentsSheet = XLSX.utils.json_to_sheet(
        reportRows.map((s) => ({
          Admission: s.admissionNumber,
          Name: s.fullName,
          Section: s.sectionName ?? "",
          Gender: s.gender ?? "",
        })),
      );
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
      XLSX.utils.book_append_sheet(wb, studentsSheet, "Students");
      XLSX.writeFile(wb, `class-report-${className.replace(/\s+/g, "-")}-${stamp}.xlsx`);
      return;
    }

    const badgeMark = `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'>
  <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#6a9570'/><stop offset='1' stop-color='#3f6b5a'/></linearGradient></defs>
  <circle cx='45' cy='45' r='41' fill='url(#g)'/>
  <circle cx='45' cy='45' r='34' fill='none' stroke='white' stroke-opacity='0.7' stroke-width='2'/>
  <text x='45' y='51' text-anchor='middle' font-family='Arial' font-size='18' fill='white' font-weight='700'>QS</text>
</svg>`;
    const badgeUrl = `${window.location.origin}/school-badge-v2.png`;
    const teacherNames = [
      ...new Set(
        sections
          .filter((s) => s.classRoomId === selectedReportRoom.id)
          .map((s) => (s.classTeacherName ?? "").trim())
          .filter(Boolean),
      ),
    ];
    const teacherLabel = teacherNames.length > 0 ? teacherNames.join(", ") : "Not assigned";
    const year = new Date().getFullYear();
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const drawWatermark = (dataUrl: string) => {
      const wmW = pageW * 0.58;
      const wmH = wmW;
      const x = (pageW - wmW) / 2;
      const y = (pageH - wmH) / 2 + 10;
      pdf.addImage(dataUrl, "PNG", x, y, wmW, wmH, undefined, "FAST", 0);
    };

    const fallbackBadgeDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(badgeMark)}`;
    const loadImageDataUrl = async (src: string, alpha = 1): Promise<string> =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth || 300;
          c.height = img.naturalHeight || 300;
          const ctx = c.getContext("2d");
          if (!ctx) return resolve(fallbackBadgeDataUrl);
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.globalAlpha = alpha;
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/png"));
        };
        img.onerror = () => resolve(fallbackBadgeDataUrl);
        img.src = src;
      });

    const wm = await loadImageDataUrl(badgeUrl, 0.12).catch(() => fallbackBadgeDataUrl);
    const badge = await loadImageDataUrl(badgeUrl, 1).catch(() => fallbackBadgeDataUrl);
    drawWatermark(wm);

    pdf.addImage(badge, "PNG", 40, 26, 42, 42, undefined, "FAST");
    pdf.setFontSize(15);
    pdf.setTextColor(31, 63, 48);
    pdf.text("Queens Nursery and Primary School", 92, 50);
    pdf.setDrawColor(223, 232, 225);
    pdf.line(40, 74, pageW - 40, 74);

    autoTable(pdf, {
      startY: 84,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6, lineColor: [226, 226, 226], lineWidth: 0.6 },
      body: [
        ["Class", className, "Term", term],
        ["Class Teacher(s)", teacherLabel, "Format", reportType],
        ["Students", String(reportStats.students), "Streams / Sections", String(reportStats.streams)],
      ],
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [247, 247, 247], cellWidth: 120 },
        1: { cellWidth: 170 },
        2: { fontStyle: "bold", fillColor: [247, 247, 247], cellWidth: 130 },
        3: { cellWidth: 120 },
      },
    });

    autoTable(pdf, {
      startY: (pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY
        ? ((pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14)
        : 180,
      head: [["ADMISSION", "NAME", "SECTION", "GENDER"]],
      body:
        reportRows.length > 0
          ? reportRows.map((s) => [s.admissionNumber, s.fullName, s.sectionName ?? "-", s.gender ?? "-"])
          : [["-", "No students found", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [239, 245, 241], textColor: [45, 52, 54], fontStyle: "bold", fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 6, lineColor: [221, 221, 221], lineWidth: 0.6 },
    });

    const footer = `Copyright © ${year} Queens Nursery and Primary School, Bunamwaya. All rights reserved.`;
    pdf.setDrawColor(232, 232, 232);
    pdf.line(40, pageH - 34, pageW - 40, pageH - 34);
    pdf.setFontSize(9.5);
    pdf.setTextColor(95, 107, 103);
    pdf.text(footer, pageW / 2, pageH - 20, { align: "center" });
    pdf.save(`class-report-${className.replace(/\s+/g, "-")}-${stamp}.pdf`);
  };

  useEffect(() => {
    setRosterSectionFilter("");
  }, [rosterClassId]);

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
      const [roomRows, categoryRows, sectionRows, studentRows, teacherRows] = await Promise.all([
        fetchClassrooms(),
        fetchClassCategories(),
        fetchClassSections(),
        fetchStudents({ limit: 500 }),
        fetchTeachers(),
      ]);
      setRooms(roomRows);
      setCategories(categoryRows);
      setSections(sectionRows);
      setStudents(studentRows);
      setTeachers(teacherRows);
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
        : section === "class_students_roster"
          ? "classes.page.classStudentsRosterTitle"
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
        : section === "class_students_roster"
          ? "classes.page.classStudentsRosterIntro"
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
                  <select
                    value={sectionTeacher}
                    onChange={(e) => setSectionTeacher(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t("classes.sections.placeholderTeacher")}</option>
                    {sectionTeacher && !teachers.some((x) => x.displayName === sectionTeacher) ? (
                      <option value={sectionTeacher}>{sectionTeacher}</option>
                    ) : null}
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.displayName}>
                        {teacher.displayName}
                      </option>
                    ))}
                  </select>
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
        {section === "class_students_roster" ? (
          <>
            <button
              type="button"
              className="mb-3 inline-flex items-center gap-2 rounded-xl border border-[#e0d8cc] bg-white px-3 py-2 text-sm font-semibold text-[#2d3436] shadow-sm transition hover:bg-[#faf7f0]"
              onClick={() => onCloseClassRoster?.()}
            >
              <span aria-hidden className="text-[#636e72]">
                ←
              </span>
              {t("classes.classStudents.rosterBack")}
            </button>
            <h1 className="text-xl font-bold tracking-tight text-[#2d3436]">
              {rosterRoom?.name ?? t("classes.classStudents.unknownClass")}
              <span className="block text-base font-semibold text-[#636e72] sm:inline sm:before:content-['_·_']">
                {t("classes.page.classStudentsRosterTitleSuffix")}
              </span>
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#636e72]">{t(introKey)}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold tracking-tight text-[#2d3436]">{t(titleKey)}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#636e72]">{t(introKey)}</p>
          </>
        )}
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
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#636e72]">
            {t("classes.classStudents.summaryTableTitle")}
          </h2>
          <div className="mt-3 min-w-0 overflow-hidden">
            <table className="table-fixed w-full text-left text-sm">
              <thead className="border-b border-[#ebe4d9] text-[10px] font-bold uppercase tracking-wide text-[#636e72] sm:text-[11px]">
                <tr>
                  <th className="min-w-0 py-2 pr-2">{t("classes.classStudents.col.class")}</th>
                  <th className="w-16 py-2 pr-2 text-center sm:w-20">{t("classes.classStudents.col.total")}</th>
                  <th className="min-w-0 py-2 pr-2">{t("classes.classStudents.col.streams")}</th>
                  <th className="w-28 py-2 text-right sm:w-32">{t("students.col.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ebe3]">
                {classStudentsSummaryRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#636e72]">
                      {t("classes.sections.emptyNeedClasses")}
                    </td>
                  </tr>
                ) : (
                  classStudentsSummaryRows.map(({ room, streamCounts, totalInClass }) => {
                    const streamLabel =
                      streamCounts.length === 0
                        ? "—"
                        : streamCounts.map((x) => `${x.name}: ${x.count}`).join(" · ");
                    return (
                      <tr key={room.id} className="transition-colors hover:bg-[#f0f7f4]/90">
                        <td className="min-w-0 truncate py-2 pr-2 font-semibold text-[#2d3436]">{room.name}</td>
                        <td className="py-2 pr-2 text-center tabular-nums font-medium text-[#2d3436]">
                          {totalInClass}
                        </td>
                        <td className="min-w-0 py-2 pr-2 text-xs leading-snug text-[#636e72] sm:text-sm">
                          {streamLabel}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            type="button"
                            className="rounded-lg bg-gradient-to-br from-[#5a8faf] to-[#3d6f8a] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:brightness-110 sm:text-sm"
                            onClick={() => onOpenClassRoster?.(room.id)}
                          >
                            {t("classes.classStudents.viewAll")}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#636e72]">{t("classes.classStudents.hintViewAll")}</p>
          <p className="mt-2 rounded-lg border border-dashed border-[#d9cfbf] bg-[#fffaf2] px-3 py-2 text-xs text-[#636e72]">
            Bulk upload (Excel) can continue via admissions import.
          </p>
        </section>
      ) : null}

      {section === "class_students_roster" ? (
        <section className={cardClass}>
          {!rosterClassId || rosterClassId < 1 ? (
            <p className="text-sm text-[#636e72]">{t("classes.classStudents.rosterInvalid")}</p>
          ) : !rosterRoom ? (
            <p className="text-sm text-[#636e72]">{t("classes.classStudents.rosterMissingClass")}</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1 lg:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#636e72]">
                    {t("toolbar.filter")} · {t("classes.classStudents.sortByStream")}
                  </span>
                  <select
                    value={rosterSectionFilter}
                    onChange={(e) => setRosterSectionFilter(e.target.value)}
                    className={inputClass}
                    aria-label={t("classes.classStudents.sortByStream")}
                  >
                    <option value="">{t("classes.classStudents.allStreams")}</option>
                    {sections
                      .filter((x) => x.classRoomId === rosterClassId)
                      .map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-2">
                  <div className="flex min-w-[140px] flex-1 flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#636e72]">{t("toolbar.sort")}</span>
                    <select
                      value={rosterSortBy}
                      onChange={(e) => setRosterSortBy(e.target.value as "name" | "stream")}
                      className={inputClass}
                    >
                      <option value="name">{t("classes.classStudents.sortByName")}</option>
                      <option value="stream">{t("classes.classStudents.sortByStream")}</option>
                    </select>
                  </div>
                  <div className="flex min-w-[140px] flex-1 flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#636e72]">
                      {t("dashboard.expense.sortDirection")}
                    </span>
                    <select
                      value={rosterSortDir}
                      onChange={(e) => setRosterSortDir(e.target.value as "asc" | "desc")}
                      className={inputClass}
                    >
                      <option value="asc">{t("dashboard.expense.sort.az")}</option>
                      <option value="desc">{t("dashboard.expense.sort.za")}</option>
                    </select>
                  </div>
                  <p className="w-full text-xs text-[#636e72] sm:w-auto sm:self-center">
                    {classRosterRows.length} {classRosterRows.length === 1 ? "student" : "students"}
                  </p>
                </div>
              </div>

              <div className="mt-4 min-w-0 overflow-hidden">
                <table className="table-fixed w-full text-left text-sm">
                  <thead className="border-b border-[#ebe4d9] text-[10px] font-bold uppercase tracking-wide text-[#636e72] sm:text-[11px]">
                    <tr>
                      <th className="min-w-0 py-2 pr-2">{t("students.col.name")}</th>
                      <th className="hidden w-[28%] min-w-0 py-2 pr-2 sm:table-cell">{t("students.col.class")}</th>
                      <th className="w-[22%] min-w-0 py-2 pr-2">{t("students.col.section")}</th>
                      <th className="min-w-[11rem] py-2 pl-2 text-right sm:min-w-[13rem]">
                        {t("students.col.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ebe3]">
                    {classRosterRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#636e72]">
                          {t("students.noMatches")}
                        </td>
                      </tr>
                    ) : (
                      classRosterRows.map((s) => (
                        <tr key={s.id} className="transition-colors hover:bg-[#f0f7f4]/90">
                          <td className="min-w-0 truncate py-2 pr-2 font-medium text-[#2d3436]">{s.fullName}</td>
                          <td className="hidden min-w-0 truncate py-2 pr-2 sm:table-cell">{s.className ?? "—"}</td>
                          <td className="min-w-0 truncate py-2 pr-2 text-[#636e72]">{s.sectionName ?? "—"}</td>
                          <td className="py-2 pl-2 text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <button
                                type="button"
                                className={rosterMoveSectionBtn}
                                title={t("classes.classStudents.moveSectionHint")}
                                onClick={() =>
                                  setRosterStudentModal({ studentId: s.id, focusSection: true })
                                }
                              >
                                {t("classes.classStudents.moveSection")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
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
          <h2 className="text-base font-bold text-[#2d3436]">{t("classes.reports.cardTitle")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-[#636e72]">
              {t("classes.reports.fieldClass")} *
              <select
                value={reportClassId}
                onChange={(e) => setReportClassId(e.target.value)}
                className={inputClass}
                aria-label={t("classes.reports.fieldClass")}
              >
                <option value="">{t("classes.reports.classPlaceholder")}</option>
                {rooms.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name} ({r.academicYear})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-[#636e72]">
              {t("classes.reports.fieldTerm")}
              <input
                value={reportTerm}
                onChange={(e) => setReportTerm(e.target.value)}
                className={inputClass}
                placeholder={t("classes.reports.termPlaceholder")}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-[#636e72]">
              {t("classes.reports.fieldFormat")}
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as "PDF" | "Excel")}
                className={inputClass}
                aria-label={t("classes.reports.fieldFormat")}
              >
                <option value="PDF">PDF</option>
                <option value="Excel">Excel</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#636e72]">
              {reportClassId ? t("classes.reports.previewReady") : t("classes.reports.helperSelectClass")}
            </p>
            <button
              type="button"
              disabled={!selectedReportRoom}
              onClick={handleGenerateReport}
              className="rounded-lg bg-[#6a9570] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("classes.reports.btnGenerate")}
            </button>
          </div>

          <div className="mt-3 rounded-lg border border-[#ebe4d9] bg-[#f8f6f1] px-4 py-3 text-sm text-[#636e72]">
            <p className="font-semibold text-[#2d3436]">{t("classes.reports.previewTitle")}</p>
            {!selectedReportRoom ? (
              <p className="mt-2">{t("classes.reports.previewMissingClass")}</p>
            ) : (
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-[#2d3436]">{t("classes.reports.previewClass")}:</span>{" "}
                  {selectedReportRoom.name}
                </p>
                <p>
                  <span className="font-semibold text-[#2d3436]">{t("classes.reports.previewTerm")}:</span>{" "}
                  {reportTerm.trim() || t("classes.reports.termAny")}
                </p>
                <p>
                  <span className="font-semibold text-[#2d3436]">{t("classes.reports.previewFormat")}:</span> {reportType}
                </p>
                <p>
                  <span className="font-semibold text-[#2d3436]">{t("classes.reports.previewStudents")}:</span>{" "}
                  {reportStats.students}
                </p>
                <p>
                  <span className="font-semibold text-[#2d3436]">{t("classes.reports.previewStreams")}:</span>{" "}
                  {reportStats.streams}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <StudentDetailModal
        studentId={rosterStudentModal?.studentId ?? null}
        initialEditing
        focusSectionField={rosterStudentModal?.focusSection ?? false}
        streamOptions={
          rosterStudentModal?.focusSection && rosterStreamNames.length > 0 ? rosterStreamNames : null
        }
        onClose={() => setRosterStudentModal(null)}
        onChanged={() => void loadDbData()}
      />
    </div>
  );
}
