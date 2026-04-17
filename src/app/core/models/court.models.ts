// ── Respuestas ────────────────────────────────────────────────────────────────

export interface CourtResponse {
  id: string;
  address: string;
  active: boolean;
}

// ── Requests ──────────────────────────────────────────────────────────────────

export interface CreateCourtRequest {
  address: string;
}

export interface UpdateCourtRequest {
  address: string;
}
