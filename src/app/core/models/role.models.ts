// ── Entidades ─────────────────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface Permission {
  id: string;
  name: string;
  feature: string;
}

// ── Requests ──────────────────────────────────────────────────────────────────

/** POST /api/Roles */
export interface CreateRoleRequest {
  name: string;
  description: string;
  permissionIds: string[];
}

/** PUT /api/Roles/{id} */
export interface UpdateRoleRequest {
  description: string;
  permissionIds: string[];
}
