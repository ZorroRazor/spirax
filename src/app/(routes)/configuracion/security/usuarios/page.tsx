"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Copy, Shield, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Types ──────────────────────────────────────────────────────────────────────
enum UserStatus { ACTIVE = "active", INACTIVE = "inactive", SUSPENDED = "suspended" }
enum UserRole { ADMIN = "Administrador", SUPERVISOR = "Supervisor", OPERATOR = "Operario", ANALYST = "Analista", VIEWER = "Visor" }

type User = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  groups: string[];
  status: UserStatus;
  lastLogin?: string;
  createdAt: string;
};

type UserFormData = Omit<User, "id" | "lastLogin" | "createdAt">;

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_USERS: User[] = [
  { id: 1, username: "admin", fullName: "Administrador del Sistema", email: "admin@engyon.com", role: UserRole.ADMIN, groups: ["Administradores"], status: UserStatus.ACTIVE, lastLogin: "2026-02-18T09:14:00Z", createdAt: "2025-01-10T08:00:00Z" },
  { id: 2, username: "supervisor-01", fullName: "Carlos Martínez", email: "c.martinez@empresa.com", role: UserRole.SUPERVISOR, groups: ["Supervisores", "Planta Norte"], status: UserStatus.ACTIVE, lastLogin: "2026-02-18T08:30:00Z", createdAt: "2025-03-15T10:00:00Z" },
  { id: 3, username: "operario-01", fullName: "Luis García", email: "l.garcia@empresa.com", role: UserRole.OPERATOR, groups: ["Operarios", "Turno Mañana"], status: UserStatus.ACTIVE, lastLogin: "2026-02-17T22:10:00Z", createdAt: "2025-04-01T08:00:00Z" },
  { id: 4, username: "operario-02", fullName: "Ana Fernández", email: "a.fernandez@empresa.com", role: UserRole.OPERATOR, groups: ["Operarios", "Turno Tarde"], status: UserStatus.ACTIVE, lastLogin: "2026-02-18T06:05:00Z", createdAt: "2025-04-01T08:00:00Z" },
  { id: 5, username: "analista-01", fullName: "María López", email: "m.lopez@empresa.com", role: UserRole.ANALYST, groups: ["Analistas", "Energía"], status: UserStatus.ACTIVE, lastLogin: "2026-02-17T16:45:00Z", createdAt: "2025-06-10T08:00:00Z" },
  { id: 6, username: "visor-externo", fullName: "Pedro Sánchez (Externo)", email: "p.sanchez@consultora.com", role: UserRole.VIEWER, groups: ["Externos"], status: UserStatus.SUSPENDED, lastLogin: "2026-01-05T11:00:00Z", createdAt: "2025-09-01T08:00:00Z" },
  { id: 7, username: "ops-01", fullName: "Javier Ruiz", email: "j.ruiz@empresa.com", role: UserRole.OPERATOR, groups: ["Operarios", "Turno Noche"], status: UserStatus.INACTIVE, createdAt: "2025-05-20T08:00:00Z" },
];

// ── Status / Role badge configs ────────────────────────────────────────────────
const statusConfig: Record<UserStatus, { variant: "success" | "warning" | "secondary"; label: string }> = {
  [UserStatus.ACTIVE]: { variant: "success", label: "Activo" },
  [UserStatus.INACTIVE]: { variant: "secondary", label: "Inactivo" },
  [UserStatus.SUSPENDED]: { variant: "warning", label: "Suspendido" },
};

const roleBadgeClass: Record<UserRole, string> = {
  [UserRole.ADMIN]: "bg-red-100 text-red-700",
  [UserRole.SUPERVISOR]: "bg-blue-100 text-blue-700",
  [UserRole.OPERATOR]: "bg-emerald-100 text-emerald-700",
  [UserRole.ANALYST]: "bg-purple-100 text-purple-700",
  [UserRole.VIEWER]: "bg-slate-100 text-slate-600",
};

function formatLastLogin(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ── User Form Dialog ───────────────────────────────────────────────────────────
function UserFormDialog({
  open, onClose, onSubmit, editingUser, existingUsers,
}: {
  open: boolean; onClose: () => void; onSubmit: (d: UserFormData) => void;
  editingUser: User | null; existingUsers: User[];
}) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.OPERATOR);
  const [status, setStatus] = useState<UserStatus>(UserStatus.ACTIVE);
  const [groupsText, setGroupsText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useState(() => {
    if (open) {
      setErrors({});
      if (editingUser) {
        setUsername(editingUser.username);
        setFullName(editingUser.fullName);
        setEmail(editingUser.email);
        setRole(editingUser.role);
        setStatus(editingUser.status);
        setGroupsText(editingUser.groups.join(", "));
      } else {
        setUsername(""); setFullName(""); setEmail("");
        setRole(UserRole.OPERATOR); setStatus(UserStatus.ACTIVE); setGroupsText("");
      }
    }
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = "Obligatorio";
    else if (existingUsers.find((u) => u.username === username.trim() && u.id !== editingUser?.id))
      e.username = "Ya existe un usuario con ese nombre";
    if (!fullName.trim()) e.fullName = "Obligatorio";
    if (!email.trim()) e.email = "Obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      username: username.trim(), fullName: fullName.trim(), email: email.trim(),
      role, status, groups: groupsText.split(",").map((g) => g.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingUser ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          <DialogDescription>{editingUser ? `Modificando "${editingUser.username}"` : "Crea un nuevo usuario del sistema."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nombre de usuario *</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="operario-03" className={errors.username ? "border-red-400" : ""} />
            {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
          </div>
          <div className="space-y-1">
            <Label>Nombre completo *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre y apellidos" className={errors.fullName ? "border-red-400" : ""} />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
          </div>
          <div className="space-y-1">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" className={errors.email ? "border-red-400" : ""} />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Rol *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as UserStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserStatus.ACTIVE}>Activo</SelectItem>
                  <SelectItem value={UserStatus.INACTIVE}>Inactivo</SelectItem>
                  <SelectItem value={UserStatus.SUSPENDED}>Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Grupos (separados por coma)</Label>
            <Input value={groupsText} onChange={(e) => setGroupsText(e.target.value)} placeholder="Operarios, Turno Mañana" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editingUser ? "Guardar cambios" : "Crear usuario"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const nextId = () => Math.max(...users.map((u) => u.id), 0) + 1;

  const visibleUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((u) => {
      if (q && !u.username.toLowerCase().includes(q) && !u.fullName.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      if (roleFilter !== "__all__" && u.role !== roleFilter) return false;
      if (statusFilter !== "__all__" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const allSelected = visibleUsers.length > 0 && visibleUsers.every((u) => selectedIds.has(u.id));
  const someSelected = visibleUsers.some((u) => selectedIds.has(u.id));

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds((p) => { const n = new Set(p); visibleUsers.forEach((u) => n.delete(u.id)); return n; });
    else setSelectedIds((p) => new Set([...p, ...visibleUsers.map((u) => u.id)]));
  };

  const handleAdd = (data: UserFormData) => {
    setUsers((p) => [...p, { ...data, id: nextId(), createdAt: new Date().toISOString() }]);
  };

  const handleUpdate = (data: UserFormData) => {
    if (!editingUser) return;
    setUsers((p) => p.map((u) => u.id === editingUser.id ? { ...u, ...data } : u));
    setEditingUser(null);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Eliminar este usuario?")) setUsers((p) => p.filter((u) => u.id !== id));
  };

  const handleBulkDelete = () => {
    if (window.confirm(`¿Eliminar ${selectedIds.size} usuario(s)?`)) {
      setUsers((p) => p.filter((u) => !selectedIds.has(u.id)));
      setSelectedIds(new Set());
    }
  };

  const handleToggleStatus = (id: number) => {
    setUsers((p) => p.map((u) => u.id === id ? { ...u, status: u.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE } : u));
  };

  const activeCount = users.filter((u) => u.status === UserStatus.ACTIVE).length;

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
            <p className="mt-1 text-sm text-slate-500">
              {users.length} usuario{users.length !== 1 ? "s" : ""} · {activeCount} activo{activeCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => { setEditingUser(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Buscar por usuario, nombre, email…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Rol" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los roles</SelectItem>
              {Object.values(UserRole).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos</SelectItem>
              <SelectItem value={UserStatus.ACTIVE}>Activos</SelectItem>
              <SelectItem value={UserStatus.INACTIVE}>Inactivos</SelectItem>
              <SelectItem value={UserStatus.SUSPENDED}>Suspendidos</SelectItem>
            </SelectContent>
          </Select>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-slate-500">{selectedIds.size} seleccionados</span>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Eliminar seleccionados</Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll}
                    data-state={someSelected && !allSelected ? "indeterminate" : undefined} />
                </TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden md:table-cell">Nombre completo</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden xl:table-cell">Grupos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Último acceso</TableHead>
                <TableHead className="text-right w-28">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleUsers.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="py-12 text-center text-sm text-slate-400">Sin resultados.</TableCell></TableRow>
              ) : visibleUsers.map((user) => {
                const sc = statusConfig[user.status];
                return (
                  <TableRow key={user.id} className={`hover:bg-slate-50 ${selectedIds.has(user.id) ? "bg-blue-50" : ""}`}>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(user.id)}
                        onCheckedChange={() => setSelectedIds((p) => { const n = new Set(p); n.has(user.id) ? n.delete(user.id) : n.add(user.id); return n; })} />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium text-slate-900 text-sm">{user.username}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-slate-700 text-sm">{user.fullName}</TableCell>
                    <TableCell className="hidden lg:table-cell text-slate-500 text-sm">{user.email}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleBadgeClass[user.role]}`}>{user.role}</span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.groups.map((g) => <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-slate-500">{formatLastLogin(user.lastLogin)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => handleToggleStatus(user.id)}
                          title={user.status === UserStatus.ACTIVE ? "Desactivar" : "Activar"}>
                          {user.status === UserStatus.ACTIVE ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5 text-emerald-600" />}
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => { setEditingUser(user); setIsFormOpen(true); }} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={() => handleDelete(user.id)} title="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <UserFormDialog open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingUser(null); }}
        onSubmit={(d) => { editingUser ? handleUpdate(d) : handleAdd(d); }}
        editingUser={editingUser} existingUsers={users} />
    </section>
  );
}
