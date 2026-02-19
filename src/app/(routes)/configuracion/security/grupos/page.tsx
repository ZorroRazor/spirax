"use client";

import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ── Types ──────────────────────────────────────────────────────────────────────
type GroupMember = {
  username: string;
  fullName: string;
  role: string;
};

type Group = {
  id: number;
  name: string;
  description: string;
  members: GroupMember[];
  createdAt: string;
};

type GroupFormData = {
  name: string;
  description: string;
  membersText: string; // comma-separated usernames
};

// ── Mock data ──────────────────────────────────────────────────────────────────
const MOCK_GROUPS: Group[] = [
  {
    id: 1, name: "Administradores", description: "Equipo con acceso total al sistema",
    members: [{ username: "admin", fullName: "Administrador del Sistema", role: "Administrador" }],
    createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: 2, name: "Supervisores", description: "Supervisores de turno y planta",
    members: [{ username: "supervisor-01", fullName: "Carlos Martínez", role: "Supervisor" }],
    createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: 3, name: "Operarios", description: "Operarios de producción",
    members: [
      { username: "operario-01", fullName: "Luis García", role: "Operario" },
      { username: "operario-02", fullName: "Ana Fernández", role: "Operario" },
      { username: "ops-01", fullName: "Javier Ruiz", role: "Operario" },
    ],
    createdAt: "2025-01-10T08:00:00Z",
  },
  {
    id: 4, name: "Analistas", description: "Equipo de análisis de datos y KPIs",
    members: [{ username: "analista-01", fullName: "María López", role: "Analista" }],
    createdAt: "2025-06-10T08:00:00Z",
  },
  {
    id: 5, name: "Turno Mañana", description: "Turno 06:00–14:00",
    members: [
      { username: "operario-01", fullName: "Luis García", role: "Operario" },
      { username: "supervisor-01", fullName: "Carlos Martínez", role: "Supervisor" },
    ],
    createdAt: "2025-03-01T08:00:00Z",
  },
  {
    id: 6, name: "Turno Tarde", description: "Turno 14:00–22:00",
    members: [{ username: "operario-02", fullName: "Ana Fernández", role: "Operario" }],
    createdAt: "2025-03-01T08:00:00Z",
  },
  {
    id: 7, name: "Turno Noche", description: "Turno 22:00–06:00",
    members: [{ username: "ops-01", fullName: "Javier Ruiz", role: "Operario" }],
    createdAt: "2025-03-01T08:00:00Z",
  },
  {
    id: 8, name: "Planta Norte", description: "Personal de la planta norte",
    members: [
      { username: "supervisor-01", fullName: "Carlos Martínez", role: "Supervisor" },
      { username: "analista-01", fullName: "María López", role: "Analista" },
    ],
    createdAt: "2025-04-15T10:00:00Z",
  },
  {
    id: 9, name: "Energía", description: "Equipo de gestión energética",
    members: [{ username: "analista-01", fullName: "María López", role: "Analista" }],
    createdAt: "2025-06-10T08:00:00Z",
  },
  {
    id: 10, name: "Externos", description: "Usuarios externos con acceso limitado",
    members: [{ username: "visor-externo", fullName: "Pedro Sánchez (Externo)", role: "Visor" }],
    createdAt: "2025-09-01T08:00:00Z",
  },
];

// ── Group Form Dialog ──────────────────────────────────────────────────────────
function GroupFormDialog({
  open, onClose, onSubmit, editingGroup, existingGroups,
}: {
  open: boolean; onClose: () => void; onSubmit: (d: GroupFormData) => void;
  editingGroup: Group | null; existingGroups: Group[];
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [membersText, setMembersText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useState(() => {
    if (open) {
      setErrors({});
      if (editingGroup) {
        setName(editingGroup.name);
        setDescription(editingGroup.description);
        setMembersText(editingGroup.members.map((m) => m.username).join(", "));
      } else {
        setName(""); setDescription(""); setMembersText("");
      }
    }
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Obligatorio";
    else if (existingGroups.find((g) => g.name === name.trim() && g.id !== editingGroup?.id))
      e.name = "Ya existe un grupo con ese nombre";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({ name: name.trim(), description: description.trim(), membersText });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingGroup ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
          <DialogDescription>{editingGroup ? `Modificando "${editingGroup.name}"` : "Crea un nuevo grupo de usuarios."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nombre del grupo *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Equipo Mantenimiento" className={errors.name ? "border-red-400" : ""} />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descripción del grupo" />
          </div>
          <div className="space-y-1">
            <Label>Miembros (usernames, separados por coma)</Label>
            <Input value={membersText} onChange={(e) => setMembersText(e.target.value)} placeholder="operario-01, operario-02" />
            <p className="text-xs text-slate-400">Introduce los nombres de usuario separados por comas.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editingGroup ? "Guardar cambios" : "Crear grupo"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Members row ────────────────────────────────────────────────────────────────
function MembersRow({ members, colSpan }: { members: GroupMember[]; colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-slate-50 py-3 px-6">
        {members.length === 0 ? (
          <span className="text-xs text-slate-400 italic">Sin miembros asignados.</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div key={m.username} className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-2 py-1">
                <span className="text-xs font-mono font-medium text-slate-800">{m.username}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">{m.fullName}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function GruposPage() {
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const nextId = () => Math.max(...groups.map((g) => g.id), 0) + 1;

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.members.some((m) => m.username.toLowerCase().includes(q) || m.fullName.toLowerCase().includes(q))
    );
  }, [groups, searchQuery]);

  const handleAdd = (data: GroupFormData) => {
    const members: GroupMember[] = data.membersText
      .split(",").map((s) => s.trim()).filter(Boolean)
      .map((username) => ({ username, fullName: username, role: "—" }));
    setGroups((p) => [...p, { id: nextId(), name: data.name, description: data.description, members, createdAt: new Date().toISOString() }]);
  };

  const handleUpdate = (data: GroupFormData) => {
    if (!editingGroup) return;
    const existingMemberMap = new Map(editingGroup.members.map((m) => [m.username, m]));
    const members: GroupMember[] = data.membersText
      .split(",").map((s) => s.trim()).filter(Boolean)
      .map((username) => existingMemberMap.get(username) ?? { username, fullName: username, role: "—" });
    setGroups((p) => p.map((g) => g.id === editingGroup.id ? { ...g, name: data.name, description: data.description, members } : g));
    setEditingGroup(null);
  };

  const handleDelete = (group: Group) => {
    if (window.confirm(`¿Eliminar el grupo "${group.name}"?`)) {
      setGroups((p) => p.filter((g) => g.id !== group.id));
      if (expandedId === group.id) setExpandedId(null);
    }
  };

  const toggleExpand = (id: number) => setExpandedId((prev) => (prev === id ? null : id));

  const totalMembers = groups.reduce((acc, g) => acc + g.members.length, 0);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Grupos</h1>
            <p className="mt-1 text-sm text-slate-500">
              {groups.length} grupo{groups.length !== 1 ? "s" : ""} · {totalMembers} asignaciones totales
            </p>
          </div>
          <Button onClick={() => { setEditingGroup(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Grupo
          </Button>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Buscar grupos o miembros…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-8" />
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Descripción</TableHead>
                <TableHead className="w-28 text-center">Miembros</TableHead>
                <TableHead className="hidden lg:table-cell">Vista previa</TableHead>
                <TableHead className="text-right w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-slate-400">Sin resultados.</TableCell></TableRow>
              ) : filteredGroups.map((group) => (
                <React.Fragment key={group.id}>
                  <TableRow className="hover:bg-slate-50">
                    <TableCell>
                      <Button variant="ghost" size="icon-xs" onClick={() => toggleExpand(group.id)}>
                        {expandedId === group.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                          <Users className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <span className="font-medium text-slate-900">{group.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">{group.description}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{group.members.length}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {group.members.slice(0, 3).map((m) => (
                          <span key={m.username} className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{m.username}</span>
                        ))}
                        {group.members.length > 3 && (
                          <span className="text-xs text-slate-400">+{group.members.length - 3} más</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => { setEditingGroup(group); setIsFormOpen(true); }} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={() => handleDelete(group)} title="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === group.id && (
                    <MembersRow members={group.members} colSpan={6} />
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <GroupFormDialog open={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingGroup(null); }}
        onSubmit={(d) => { editingGroup ? handleUpdate(d) : handleAdd(d); }}
        editingGroup={editingGroup} existingGroups={groups} />
    </section>
  );
}
