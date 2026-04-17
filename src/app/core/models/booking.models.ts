// ── Enums ─────────────────────────────────────────────────────────────────────

/** Estado de la reserva. Valores numéricos confirmados con el backend. */
export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Cancelled = 2,
  Completed = 3,
  Abandoned = 4,
}

/**
 * Modalidad de juego. Actualmente solo DosVsDos (2v2) está en alcance.
 * UnoVsUno puede reintegrarse en el futuro.
 */
export enum BookingType {
  DosVsDos = 2,
}

/**
 * Visibilidad del turno.
 * Open: cualquier socio puede solicitar unirse desde el dashboard.
 * Closed: solo los socios invitados por el creador pueden ver y aceptar/rechazar.
 */
export enum BookingVisibility {
  Closed = 0,
  Open = 1,
}

/** Estado del participante en una reserva. */
export enum BookingParticipantStatus {
  Invited = 0,
  Accepted = 1,
  Declined = 2,
  PendingRequest = 3,
}

// ── Respuestas ────────────────────────────────────────────────────────────────

export interface BookingParticipantResponse {
  userId: string;
  status: BookingParticipantStatus;
  invitedAt: string;        // ISO date-time
  acceptedAt: string | null;
}

export interface BookingResponse {
  id: string;
  courtId: string;
  courtAddress: string;
  creatorId: string;
  date: string;             // ISO date: YYYY-MM-DD
  startTime: string;        // ISO time: HH:mm:ss
  endTime: string;          // ISO time: HH:mm:ss
  type: BookingType;
  visibility: BookingVisibility;
  status: BookingStatus;
  createdAt: string;        // ISO date-time
  confirmedPlayersCount: number;
}

export interface BookingWithParticipantsResponse extends BookingResponse {
  participants: BookingParticipantResponse[];
}

// ── Requests ──────────────────────────────────────────────────────────────────

export interface CreateBookingRequest {
  courtId: string;
  date: string;            // ISO date: YYYY-MM-DD
  startTime: string;       // ISO time: HH:mm:ss
  visibility: BookingVisibility;
}

export interface InviteParticipantRequest {
  userId: string;
}
