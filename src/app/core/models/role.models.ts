// ── Entidades ─────────────────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  description: string;
}

/** Rol con sus permisos completos — construido en el frontend combinando dos endpoints. */
export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
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
