import { apiUrl, authHeaders } from "./baseUrl";

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) throw new Error("Empty response");
  return JSON.parse(text) as T;
}

export type StudentApiRow = {
  id: number;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  dateOfBirth: string | null;
  dateOfBirthFormatted: string | null;
  parentEmail: string | null;
  classRoomId: number | null;
  className: string | null;
  gender: string | null;
  rollNumber: string | null;
  sectionName: string | null;
  admittedAt: string;
  hasPassportPhoto: boolean;
  nationality: string | null;
  countryCode: string | null;
  countryName: string | null;
  district: string | null;
  registrationType: string;
  previousSchool: string | null;
  previousSchoolLocation: string | null;
  lastClassAttended: string | null;
  lastTermYear: string | null;
  previousReportCardFilename: string | null;
  previousGrades: string | null;
  transferReason: string | null;
  parentAliveStatus: string | null;
  parentFullName: string | null;
  parentPhone: string | null;
  parentAddress: string | null;
  religion: string | null;
  specialNeeds: string | null;
  boardingStatus: string | null;
  residenceAddress: string | null;
  medicalInfo: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
};

export type ClassRoomOption = {
  id: number;
  name: string;
  gradeLevel: string | null;
  academicYear: string;
};

export type StudentSortBy = "date" | "id" | "name" | "class";
export type StudentSortDir = "asc" | "desc";

export async function fetchStudents(opts: {
  q?: string;
  sortBy?: StudentSortBy;
  sortDir?: StudentSortDir;
  limit?: number;
}): Promise<StudentApiRow[]> {
  const p = new URLSearchParams();
  if (opts.q?.trim()) p.set("q", opts.q.trim());
  p.set("sortBy", opts.sortBy ?? "date");
  p.set("sortDir", opts.sortDir ?? "desc");
  if (opts.limit != null) p.set("limit", String(opts.limit));
  const res = await fetch(apiUrl(`/api/me/students?${p.toString()}`), {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  const data = await readJson<{ items: StudentApiRow[] }>(res);
  return data.items;
}

export async function fetchStudent(id: number): Promise<StudentApiRow> {
  const res = await fetch(apiUrl(`/api/me/students/${id}`), {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  const data = await readJson<{ item: StudentApiRow }>(res);
  return data.item;
}

export async function fetchClassrooms(): Promise<ClassRoomOption[]> {
  const res = await fetch(apiUrl("/api/me/classrooms"), {
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  const data = await readJson<{ items: ClassRoomOption[] }>(res);
  return data.items;
}

export type CreateStudentBody = {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  parentEmail?: string;
  classRoomId?: number | null;
  gender?: string;
  rollNumber?: string;
  sectionName?: string;
  nationality?: string;
  countryCode?: string | null;
  district?: string;
  registrationType?: "first" | "continuing";
  previousSchool?: string;
  previousSchoolLocation?: string;
  lastClassAttended?: string;
  lastTermYear?: string;
  previousGrades?: string;
  transferReason?: "relocation" | "discipline" | "better_education";
  parentAliveStatus?: "both" | "one" | "none";
  parentFullName?: string;
  parentPhone?: string;
  parentAddress?: string;
  religion?: string;
  specialNeeds?: string;
  boardingStatus?: "boarding" | "day_half" | "day_full";
  residenceAddress?: string;
  medicalInfo?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  guardianName?: string;
  guardianPhone?: string;
};

export async function createStudent(body: CreateStudentBody): Promise<StudentApiRow> {
  const res = await fetch(apiUrl("/api/me/students"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  const data = await readJson<{ item: StudentApiRow }>(res);
  return data.item;
}

export type UpdateStudentBody = {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  dateOfBirth?: string | null;
  parentEmail?: string | null;
  classRoomId?: number | null;
  gender?: string | null;
  rollNumber?: string | null;
  sectionName?: string | null;
  nationality?: string | null;
  countryCode?: string | null;
  district?: string | null;
  registrationType?: "first" | "continuing";
  previousSchool?: string | null;
  previousSchoolLocation?: string | null;
  lastClassAttended?: string | null;
  lastTermYear?: string | null;
  previousGrades?: string | null;
  transferReason?: "relocation" | "discipline" | "better_education" | null;
  parentAliveStatus?: "both" | "one" | "none" | null;
  parentFullName?: string | null;
  parentPhone?: string | null;
  parentAddress?: string | null;
  religion?: string | null;
  specialNeeds?: string | null;
  boardingStatus?: "boarding" | "day_half" | "day_full" | null;
  residenceAddress?: string | null;
  medicalInfo?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
};

export async function updateStudent(
  id: number,
  body: UpdateStudentBody,
): Promise<StudentApiRow> {
  const res = await fetch(apiUrl(`/api/me/students/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  const data = await readJson<{ item: StudentApiRow }>(res);
  return data.item;
}

export async function deleteStudent(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/me/students/${id}`), {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (res.status === 404) throw new Error("Not found");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
}

export async function uploadStudentPhoto(id: number, file: File): Promise<StudentApiRow> {
  const fd = new FormData();
  fd.append("photo", file);
  const res = await fetch(apiUrl(`/api/me/students/${id}/photo`), {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd,
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  const data = await readJson<{ item: StudentApiRow }>(res);
  return data.item;
}

export async function uploadStudentTransferReport(
  id: number,
  file: File,
): Promise<StudentApiRow> {
  const fd = new FormData();
  fd.append("report", file);
  const res = await fetch(apiUrl(`/api/me/students/${id}/transfer-report`), {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd,
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  const data = await readJson<{ item: StudentApiRow }>(res);
  return data.item;
}

export type BulkUploadResult = {
  created: number;
  errors: { line: number; error: string }[];
};

export async function bulkUploadStudentsCsv(file: File): Promise<BulkUploadResult> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(apiUrl("/api/me/students/bulk"), {
    method: "POST",
    headers: { ...authHeaders() },
    body: fd,
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const err = await readJson<{ error?: string }>(res).catch(() => null);
    throw new Error(err?.error ?? "Request failed");
  }
  return readJson<BulkUploadResult>(res);
}
