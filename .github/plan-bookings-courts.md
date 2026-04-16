# Plan de desarrollo — Bookings y Courts

> Contexto: el análisis de `v1.json` identificó que los modelos y servicios de Bookings y Courts
> están completamente ausentes en el frontend. Este documento traza el orden de implementación.

---

## Estado actual

| Área | Estado |
|------|--------|
| Modelos Auth / User / Role / Permission | ✅ Correctos (bugs corregidos el 15/04/2026) |
| `BookingService` | ❌ No existe |
| `CourtService` | ❌ No existe |
| Modelos de Bookings | ❌ No existen |
| Modelos de Courts | ❌ No existen |
| Feature `/reservas` | ⚠️ Placeholder vacío |
| Feature `/mis-turnos` | ⚠️ Placeholder vacío |
| Admin > Courts | ❌ No existe |

---

## Paso 1 — Modelos (`src/app/core/models/`)

Crear el archivo `booking.models.ts` con las siguientes interfaces y enums, mapeados 1:1 contra `v1.json`:

### Enums

```typescript
// BookingStatus (integer en la API)
export enum BookingStatus {
  Pending = 0,
  Confirmed = 1,
  Cancelled = 2,
  Completed = 3,
}

// BookingType (integer en la API)
export enum BookingType {
  Closed = 0,   // Cerrado con invitaciones
  Open = 1,     // Abierto
  Combined = 2, // Combinado
}

// BookingParticipantStatus (integer en la API)
export enum BookingParticipantStatus {
  Invited = 0,
  Accepted = 1,
  Declined = 2,
}
```

> **Nota**: los valores numéricos exactos de cada enum deben confirmarse con el backend antes
> de implementar lógica de UI que dependa de ellos (ej. badges de estado).

### Interfaces de respuesta

```typescript
export interface BookingParticipantResponse {
  userId: string;
  status: BookingParticipantStatus;
  invitedAt: string;       // ISO date-time
  acceptedAt: string | null;
}

export interface BookingResponse {
  id: string;
  courtId: string;
  courtAddress: string;
  creatorId: string;
  date: string;            // ISO date: YYYY-MM-DD
  startTime: string;       // ISO time: HH:mm:ss
  endTime: string;         // ISO time: HH:mm:ss
  type: BookingType;
  status: BookingStatus;
  createdAt: string;       // ISO date-time
  confirmedPlayersCount: number;
}

export interface BookingWithParticipantsResponse extends BookingResponse {
  participants: BookingParticipantResponse[];
}
```

### Interfaces de request

```typescript
export interface CreateBookingRequest {
  courtId: string;
  date: string;       // ISO date: YYYY-MM-DD
  startTime: string;  // ISO time: HH:mm:ss
}

export interface InviteParticipantRequest {
  userId: string;
}
```

Crear el archivo `court.models.ts`:

```typescript
export interface CourtResponse {
  id: string;
  address: string;
  active: boolean;
}

export interface CreateCourtRequest {
  address: string;
}

export interface UpdateCourtRequest {
  address: string;
}
```

---

## Paso 2 — Servicios (`src/app/core/services/`)

### `booking.service.ts`

Métodos a implementar (todos retornan `Observable`, unwrapping `.pipe(map(r => r.data!))`):

| Método | HTTP | Endpoint | Retorna |
|--------|------|----------|---------|
| `getBookings(page, size)` | GET | `/api/Bookings` | `{ bookings: BookingResponse[], pagination }` |
| `getMyBookings(page, size)` | GET | `/api/Bookings/my` | `{ bookings: BookingResponse[], pagination }` |
| `getBooking(id)` | GET | `/api/Bookings/{id}` | `BookingWithParticipantsResponse` |
| `createBooking(req)` | POST | `/api/Bookings` | `BookingResponse` |
| `inviteParticipant(id, req)` | POST | `/api/Bookings/{id}/invite` | `void` (204) |
| `acceptBooking(id)` | POST | `/api/Bookings/{id}/accept` | `void` (204) |
| `cancelBooking(id)` | PATCH | `/api/Bookings/{id}/cancel` | `void` (204) |
| `completeBooking(id)` | PATCH | `/api/Bookings/{id}/complete` | `void` (204) |
| `abandonBooking(id)` | PATCH | `/api/Bookings/{id}/abandon` | `void` (204) |

### `court.service.ts`

| Método | HTTP | Endpoint | Retorna |
|--------|------|----------|---------|
| `getCourts(page, size)` | GET | `/api/Courts` | `{ courts: CourtResponse[], pagination }` |
| `getCourt(id)` | GET | `/api/Courts/{id}` | `CourtResponse` |
| `getCourtSlots(id, date)` | GET | `/api/Courts/{id}/slots?date=` | `string[]` (array de TimeOnly) |
| `createCourt(req)` | POST | `/api/Courts` | `CourtResponse` |
| `updateCourt(id, req)` | PUT | `/api/Courts/{id}` | `CourtResponse` |
| `activateCourt(id)` | PATCH | `/api/Courts/{id}/activate` | `void` (204) |
| `deactivateCourt(id)` | PATCH | `/api/Courts/{id}/deactivate` | `void` (204) |

---

## Paso 3 — Feature `/reservas`

Ruta: `/reservas` → `ReservasComponent` (actualmente placeholder).

### UX propuesta (mobile-first)

1. **Lista de turnos disponibles** — carga `getBookings()` con los turnos del próximo domingo.
   - Cada tarjeta muestra: cancha, horario, tipo, jugadores confirmados / capacidad, estado.
   - Botón "Reservar" abre el flujo de creación.

2. **Flujo de creación** (dialog o página `/reservas/nueva`):
   - Paso 1: elegir cancha (`getCourts()`) y fecha.
   - Paso 2: elegir horario (`getCourtSlots(courtId, date)`).
   - Paso 3: elegir modalidad (`BookingType`).
   - Paso 4 (si Closed o Combined): buscar socios para invitar (`GET /api/Users` con búsqueda).
   - Confirmar → `createBooking()` + `inviteParticipant()` por cada invitado.

3. **Acciones sobre turnos propios**:
   - Cancelar (hasta 1h antes) → `cancelBooking()`.
   - Invitar más socios → `inviteParticipant()`.

---

## Paso 4 — Feature `/mis-turnos`

Ruta: `/mis-turnos` → `MisTurnosComponent` (actualmente placeholder).

- Carga `getMyBookings()` paginado.
- Tabs: **Próximos** / **Pasados**.
- Cada tarjeta muestra estado, participantes, opciones de cancelar/abandonar según reglas de negocio.

---

## Paso 5 — Admin > Courts

Ruta: `/admin/canchas` — nueva sub-ruta dentro de `admin.routes.ts`.

- Lista paginada de canchas con estado (activa/inactiva).
- Acciones: crear, editar dirección, activar/desactivar.
- Patrón idéntico al existente en `admin/usuarios` y `admin/roles`.

---

## Decisiones pendientes a confirmar con el backend

1. **Valores numéricos de los enums** (`BookingStatus`, `BookingType`, `BookingParticipantStatus`) — necesarios para labels y colores en la UI.
2. **Capacidad por turno** — ¿el backend expone `maxPlayers` en `BookingResponse` o es fija (2 o 4)?  Actualmente no aparece en el contrato.
3. **Búsqueda de socios** — `GET /api/Users` solo acepta paginación; ¿hay un parámetro de búsqueda por nombre/email/nro. de socio planeado?
4. **Slots disponibles** — `GET /api/Courts/{id}/slots` devuelve `TimeOnly[]`; confirmar si filtra automáticamente slots ya reservados.
