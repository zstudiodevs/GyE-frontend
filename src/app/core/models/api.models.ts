/**
 * Envoltura genérica que el backend devuelve en todas las respuestas.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  pagination: PaginationMeta | null;
  error: ApiError | null;
}

/**
 * Metadata de paginación presente en endpoints que devuelven colecciones.
 */
export interface PaginationMeta {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Detalle del error devuelto por el backend cuando success = false.
 */
export interface ApiError {
  message: string;
}

/**
 * Parámetros de paginación enviados como query params.
 */
export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
}
