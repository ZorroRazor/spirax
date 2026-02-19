"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Types ──────────────────────────────────────────────────────────────────────
const MODULES = [
  "Overview",
  "Dashboards",
  "Analytics",
  "Reporting",
  "Operaciones > Alarmas",
  "Operaciones > Eventos",
  "Config > Data Sources",
  "Config > Tags Físicos",
  "Config > Tags Virtuales",
  "Config > KPI",
  "Config > Alarm Rules",
  "Config > Events",
  "Config > Security",
] as const;

type ModuleName = (typeof MODULES)[number];

type Permission = {
  module: ModuleName;
  read: boolean;
  write: boolean;
  del: boolean;
};

type Role = {
  id: number;
  name: string;
  description: string;
  isSystem: boolean;
  userCount: number;
  permissions: Permission[];
  createdAt: string;
};

type RoleFormData = {
  name: string;
  description: string;
  permissions: Permission[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function defaultPermissions(all = false): Permission[] {
  return MODULES.map((module) => ({ module, read: all, write: false, del: false }));
}

function fullPermissions(): Permission[] {
  return MODULES.map((module) => ({ module, read: true, write: true, del: true }));
}

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_ROLES: Role[] = [
  {
    id: 1, name: "Administrador", description: "Acceso completo al sistema", isSystem: true, userCount: 1,
    permissions: fullPermissions(), createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: 2, name: "Supervisor", description: "Supervisión de operaciones y configuración básica", isSystem: true, userCount: 2,
    permissions: MODULES.map((m) => ({
      module: m,
      read: true,
      write: m.startsWith("Config > Alarm") || m.startsWith("Operaciones"),
      del: false,
    })),
    createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: 3, name: "Operario", description: "Acceso operativo: alarmas y dashboards", isSystem: true, userCount: 3,
    permissions: MODULES.map((m) => ({
      module: m,
      read: m === "Overview" || m === "Dashboards" || m.startsWith("Operaciones"),
      write: m.startsWith("Operaciones"),
      del: false,
    })),
    createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: 4, name: "Analista", description: "Lectura completa + analytics y reporting", isSystem: true, userCount: 1,
    permissions: MODULES.map((m) => ({
      module: m,
      read: true,
      write: m === "Analytics" || m === "Reporting",
      del: false,
    })),
    createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: 5, name: "Visor", description: "Solo lectura en dashboards y analytics", isSystem: false, userCount: 1,
    permissions: MODULES.map((m) => ({
      module: m,
      read: m === "Overview" || m === "Dashboards" || m === "Analytics",
      write: false,
      del: false,
    })),
    createdAt: "2025-06-01T10:00:00Z",
  },
  {
    id: 6, name: "Externo", description: "Solo lectura en dashboards públicos", isSystem: false, userCount: 0,
    permissions: defaultPermissions(),
    createdAt: "2025-09-15T12:00:00Z",
  },
];

// ── Permissions Editor ─────────────────────────────────────────────────────────
function PermissionsEditor({
  permissions,
  onChange,
}: {
  permissions: Permission[];
  onChange: (p: Permission[]) => void;
}) {
  const update = (idx: number, field: "read" | "write" | "del", val: boolean) => {
    const next = permissions.map((p, i) => {
      if (i !== idx) return p;
      const updated = { ...p, [field]: val };
      // write/del implies read
      if ((field === "write" || field === "del") && val) updated.read = true;
      // removing read removes write + del
      if (field === "read" && !val) { updated.write = false; updated.del = false; }
      return updated;
    });
    onChange(next);
  };

  const setAll = (val: boolean) => onChange(permissions.map((p) => ({ ...p, read: val, write: val ? p.write : false, del: val ? p.del : false })));

  const allRead = permissions.every((p) => p.read);

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-600 flex-1">Módulo</span>
        <span className="text-xs font-semibold text-slate-600 w-12 text-center">Leer</span>
        <span className="text-xs font-semibold text-slate-600 w-14 text-center">Escribir</span>
        <span className="text-xs font-semibold text-slate-600 w-14 text-center">Eliminar</span>
      </div>
      <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 bg-white">
        <span className="text-xs text-slate-500 flex-1 italic">Seleccionar todo</span>
        <div className="w-12 flex justify-center">
          <Checkbox checked={allRead} onCheckedChange={(v) => setAll(!!v)} />
        </div>
        <div className="w-14" />
        <div className="w-14" />
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
        {permissions.map((p, idx) => (
          <div key={p.module} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
            <span className="text-xs text-slate-700 flex-1">{p.module}</span>
            <div className="w-12 flex justify-center">
              <Checkbox checked={p.read} onCheckedChange={(v) => update(idx, "read", !!v)} />
            </div>
            <div className="w-14 flex justify-center">
              <Checkbox checked={p.write} onCheckedChange={(v) => update(idx, "write", !!v)} />
            </div>
            <div className="w-14 flex justify-center">
              <Checkbox checked={p.del} onCheckedChange={(v) => update(idx, "del", !!v)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Role Form Dialog ───────────────────────────────────────────────────────────
function RoleFormDialog({
  open, onClose, onSubmit, editingRole, existingRoles,
}: {
  open: boolean; onClose: () => void; onSubmit: (d: RoleFormData) => void;
  editingRole: Role | null; existingRoles: Role[];
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>(defaultPermissions());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useState(() => {
    if (open) {
      setErrors({});
      if (editingRole) {
        setName(editingRole.name);
        setDescription(editingRole.description);
        setPermissions(editingRole.permissions.map((p) => ({ ...p })));
      } else {
        setName(""); setDescription(""); setPermissions(defaultPermissions());
      }
    }
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Obligatorio";
    else if (existingRoles.find((r) => r.name === name.trim() && r.id !== editingRole?.id))
      e.name = "Ya existe un rol con ese nombre";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ name: name.trim(), description: description.trim(), permissions });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingRole ? "Editar rol" : "Nuevo rol"}</DialogTitle>
          <DialogDescription>{editingRole ? `Modificando "${editingRole.name}"` : "Define un nuevo rol de acceso."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Nombre del rol *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Técnico de Mantenimiento" className={errors.name ? "border-red-400" : ""} />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción breve del rol" />
          </div>
          <div className="space-y-1">
            <Label>Permisos</Label>
            <PermissionsEditor permissions={permissions} onChange={setPermissions} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editingRole ? "Guardar cambios" : "Crear rol"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Permission summary for table cell ─────────────────────────────────────────
function PermissionSummary({ permissions }: { permissions: Permission[] }) {
  const readCount = permissions.filter((p) => p.read).length;
  const writeCount = permissions.filter((p) => p.write).length;
  const delCount = permissions.filter((p) => p.del).length;
  return (
    <div className="flex gap-1.5 text-xs">
      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{readCount}R</span>
      <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{writeCount}W</span>
      <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded">{delCount}D</span>
    </div>
  );
}

// ── Expandable permissions row ─────────────────────────────────────────────────
function PermissionsRow({ permissions, colSpan }: { permissions: Permission[]; colSpan: number }) {
  const active = permissions.filter((p) => p.read || p.write || p.del);
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-slate-50 py-3 px-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
          {active.map((p) => (
            <div key={p.module} className="flex items-center gap-2 text-xs">
              <span className="text-slate-600 flex-1">{p.module}</span>
              <div className="flex gap-1">
                {p.read && <span className="bg-blue-50 text-blue-700 px-1 rounded">R</span>}
                {p.write && <span className="bg-amber-50 text-amber-700 px-1 rounded">W</span>}
                {p.del && <span className="bg-red-50 text-red-700 px-1 rounded">D</span>}
              </div>
            </div>
          ))}
          {active.length === 0 && <span className="text-slate-400 col-span-2">Sin permisos asignados</span>}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const nextId = () => Math.max(...roles.map((r) => r.id), 0) + 1;

  const filteredRoles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [roles, searchQuery]);

  const handleAdd = (data: RoleFormData) => {
    setRoles((p) => [...p, { ...data, id: nextId(), isSystem: false, userCount: 0, createdAt: new Date().toISOString() }]);
  };

  const handleUpdate = (data: RoleFormData) => {
    if (!editingRole) return;
    setRoles((p) => p.map((r) => r.id === editingRole.id ? { ...r, ...data } : r));
    setEditingRole(null);
  };

  const handleDelete = (role: Role) => {
    if (role.isSystem) return;
    if (window.confirm(`¿Eliminar el rol "${role.name}"?`)) {
      setRoles((p) => p.filter((r) => r.id !== role.id));
    }
  };

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Roles</h1>
            <p className="mt-1 text-sm text-slate-500">
              {roles.length} roles · {roles.filter((r) => r.isSystem).length} del sistema
            </p>
          </div>
          <Button onClick={() => { setEditingRole(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Rol
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar roles…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-8" />
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead className="hidden sm:table-cell w-28 text-center">Usuarios</TableHead>
                <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                <TableHead className="text-right w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-sm text-slate-400">Sin resultados.</TableCell></TableRow>
              ) : filteredRoles.map((role) => (
                <React.Fragment key={role.id}>
                  <TableRow className="hover:bg-slate-50">
                    <TableCell>
                      <Button variant="ghost" size="icon-xs" onClick={() => toggleExpand(role.id)}>
                        {expandedId === role.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{role.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">{role.description}</TableCell>
                    <TableCell><PermissionSummary permissions={role.permissions} /></TableCell>
                    <TableCell className="hidden sm:table-cell text-center text-sm text-slate-600">{role.userCount}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {role.isSystem
                        ? <Badge variant="secondary" className="text-xs">Sistema</Badge>
                        : <Badge variant="outline" className="text-xs">Personalizado</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => { setEditingRole(role); setIsFormOpen(true); }} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" className={role.isSystem ? "opacity-30 cursor-not-allowed" : "hover:text-red-600"}
                          onClick={() => handleDelete(role)} title={role.isSystem ? "No se puede eliminar un rol del sistema" : "Eliminar"}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === role.id && (
                    <PermissionsRow permissions={role.permissions} colSpan={7} />
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <RoleFormDialog open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingRole(null); }}
        onSubmit={(d) => { editingRole ? handleUpdate(d) : handleAdd(d); }}
        editingRole={editingRole} existingRoles={roles} />
    </section>
  );
}
