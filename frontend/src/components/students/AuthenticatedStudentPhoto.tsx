import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../api/baseUrl";

type AuthenticatedStudentPhotoProps = {
  studentId: number;
  hasPhoto: boolean;
  alt: string;
  className?: string;
};

/**
 * Fetches the passport image with Bearer auth (plain <img src> cannot send headers).
 */
export function AuthenticatedStudentPhoto({
  studentId,
  hasPhoto,
  alt,
  className,
}: AuthenticatedStudentPhotoProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!hasPhoto) {
      setBlobUrl(null);
      return;
    }
    let revoked: string | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(apiUrl(`/api/me/students/${studentId}/photo`), {
          headers: { ...authHeaders() },
        });
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        const u = URL.createObjectURL(blob);
        revoked = u;
        setBlobUrl(u);
      } catch {
        if (!cancelled) setBlobUrl(null);
      }
    })();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [studentId, hasPhoto]);

  if (!hasPhoto || !blobUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#e8f4e9] to-[#d4eaf6] text-[#636e72] ${className ?? ""}`}
        aria-hidden
      >
        <svg className="h-1/2 w-1/2 opacity-50" fill="none" viewBox="0 0 24 24" aria-hidden>
          <path
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a3 3 0 100-6 3 3 0 000 6z"
          />
        </svg>
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}
