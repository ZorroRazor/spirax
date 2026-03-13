"use client";

import React, { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Building2, Network, Boxes, Cpu, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Types ──────────────────────────────────────────────────────────────────────
type AssetNodeType = "planta" | "area" | "seccion" | "equipo";

type AssetNode = {
  id: string;
  name: string;
  type: AssetNodeType;
  description: string;
  lat?: number;
  lng?: number;
  children: AssetNode[];
};

const TYPE_ORDER: AssetNodeType[] = ["planta", "area", "seccion", "equipo"];

const TYPE_LABEL: Record<AssetNodeType, string> = {
  planta: "Planta",
  area: "Área",
  seccion: "Sección",
  equipo: "Equipo",
};

const TYPE_BADGE: Record<AssetNodeType, string> = {
  planta: "bg-blue-100 text-blue-700",
  area: "bg-emerald-100 text-emerald-700",
  seccion: "bg-amber-100 text-amber-700",
  equipo: "bg-slate-100 text-slate-600",
};

const TYPE_ICON: Record<AssetNodeType, React.ReactNode> = {
  planta: <Building2 className="h-3.5 w-3.5" />,
  area: <Network className="h-3.5 w-3.5" />,
  seccion: <Boxes className="h-3.5 w-3.5" />,
  equipo: <Cpu className="h-3.5 w-3.5" />,
};

// ── Initial data (mirrors HIERARCHY_DATA) ──────────────────────────────────────
const INITIAL_TREE: AssetNode[] = [
  {
    id: "planta-norte", name: "Planta Norte", type: "planta", description: "Planta de producción norte",
    lat: 43.2627, lng: -2.9253,
    children: [
      {
        id: "area-prod", name: "Área Producción", type: "area", description: "", lat: 43.2628, lng: -2.9251,
        children: [
          { id: "sec-moldeado", name: "Sección Moldeado", type: "seccion", description: "", lat: 43.2629, lng: -2.9249, children: [
            { id: "eq-m01", name: "Moldeadora-M01", type: "equipo", description: "", children: [] },
            { id: "eq-m02", name: "Moldeadora-M02", type: "equipo", description: "", children: [] },
            { id: "eq-m03", name: "Moldeadora-M03", type: "equipo", description: "", children: [] },
          ]},
          { id: "sec-acabado", name: "Sección Acabado", type: "seccion", description: "", lat: 43.2625, lng: -2.9255, children: [
            { id: "eq-a01", name: "Cabina-A01", type: "equipo", description: "", children: [] },
            { id: "eq-a02", name: "Cabina-A02", type: "equipo", description: "", children: [] },
          ]},
          { id: "sec-ensam", name: "Sección Ensamblado", type: "seccion", description: "", lat: 43.2631, lng: -2.9247, children: [
            { id: "eq-e01", name: "Mesa-E01", type: "equipo", description: "", children: [] },
            { id: "eq-e02", name: "Mesa-E02", type: "equipo", description: "", children: [] },
          ]},
        ],
      },
      {
        id: "area-util", name: "Área Utilities", type: "area", description: "",
        children: [
          { id: "sec-hvac", name: "Sección HVAC", type: "seccion", description: "", lat: 43.2623, lng: -2.9258, children: [
            { id: "eq-h01", name: "Unidad-H01", type: "equipo", description: "", children: [] },
            { id: "eq-h02", name: "Unidad-H02", type: "equipo", description: "", children: [] },
          ]},
          { id: "sec-elec", name: "Sección Eléctrica", type: "seccion", description: "", lat: 43.2633, lng: -2.9245, children: [
            { id: "eq-qe01", name: "Cuadro-QE01", type: "equipo", description: "", children: [] },
            { id: "eq-qe02", name: "Cuadro-QE02", type: "equipo", description: "", children: [] },
          ]},
        ],
      },
      {
        id: "area-alm", name: "Área Almacén", type: "area", description: "",
        children: [
          { id: "sec-entrada", name: "Sección Entrada", type: "seccion", description: "", lat: 43.2621, lng: -2.9261, children: [
            { id: "eq-be01", name: "Báscula-BE01", type: "equipo", description: "", children: [] },
          ]},
          { id: "sec-salida", name: "Sección Salida", type: "seccion", description: "", lat: 43.2635, lng: -2.9243, children: [
            { id: "eq-bs01", name: "Báscula-BS01", type: "equipo", description: "", children: [] },
          ]},
        ],
      },
    ],
  },
  {
    id: "planta-sur", name: "Planta Sur", type: "planta", description: "Planta logística y mantenimiento",
    lat: 37.3926, lng: -5.9911,
    children: [
      {
        id: "area-log", name: "Área Logística", type: "area", description: "",
        children: [
          { id: "sec-recep", name: "Sección Recepción", type: "seccion", description: "", lat: 37.3928, lng: -5.9908, children: [
            { id: "eq-dr01", name: "Dock-R01", type: "equipo", description: "", children: [] },
            { id: "eq-dr02", name: "Dock-R02", type: "equipo", description: "", children: [] },
          ]},
          { id: "sec-exped", name: "Sección Expedición", type: "seccion", description: "", lat: 37.3924, lng: -5.9914, children: [
            { id: "eq-de01", name: "Dock-E01", type: "equipo", description: "", children: [] },
            { id: "eq-de02", name: "Dock-E02", type: "equipo", description: "", children: [] },
          ]},
        ],
      },
      {
        id: "area-maint", name: "Área Mantenimiento", type: "area", description: "",
        children: [
          { id: "sec-taller", name: "Sección Taller", type: "seccion", description: "", lat: 37.3930, lng: -5.9905, children: [
            { id: "eq-bt01", name: "Banco-T01", type: "equipo", description: "", children: [] },
            { id: "eq-bt02", name: "Banco-T02", type: "equipo", description: "", children: [] },
          ]},
          { id: "sec-repuest", name: "Sección Repuestos", type: "seccion", description: "", lat: 37.3922, lng: -5.9917, children: [
            { id: "eq-rp01", name: "Rack-RP01", type: "equipo", description: "", children: [] },
          ]},
        ],
      },
    ],
  },
];

// ── Tree helpers ───────────────────────────────────────────────────────────────
let _idCounter = 1000;
function nextId() { return `node-${++_idCounter}`; }

function mapTree(nodes: AssetNode[], fn: (node: AssetNode) => AssetNode): AssetNode[] {
  return nodes.map((n) => fn({ ...n, children: mapTree(n.children, fn) }));
}

function addChild(nodes: AssetNode[], parentId: string, child: AssetNode): AssetNode[] {
  return mapTree(nodes, (n) => n.id === parentId ? { ...n, children: [...n.children, child] } : n);
}

function updateNode(nodes: AssetNode[], id: string, updates: Partial<Pick<AssetNode, "name" | "description" | "lat" | "lng">>): AssetNode[] {
  return mapTree(nodes, (n) => n.id === id ? { ...n, ...updates } : n);
}

function deleteNode(nodes: AssetNode[], id: string): AssetNode[] {
  return nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: deleteNode(n.children, id) }));
}

function countNodes(nodes: AssetNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children), 0);
}

function countByType(nodes: AssetNode[], type: AssetNodeType): number {
  return nodes.reduce((acc, n) => acc + (n.type === type ? 1 : 0) + countByType(n.children, type), 0);
}

// ── Node Form Dialog ───────────────────────────────────────────────────────────
const GEO_TYPES: AssetNodeType[] = ["planta", "area", "seccion"];

function NodeFormDialog({
  open, onClose, onSubmit, mode, parentNode, editingNode,
}: {
  open: boolean; onClose: () => void;
  onSubmit: (name: string, description: string, lat?: number, lng?: number) => void;
  mode: "add" | "edit";
  parentNode: AssetNode | null;
  editingNode: AssetNode | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");
  const [error, setError] = useState("");
  const [geoError, setGeoError] = useState("");

  const childType: AssetNodeType | null = parentNode
    ? (TYPE_ORDER[TYPE_ORDER.indexOf(parentNode.type) + 1] ?? null)
    : "planta";

  const nodeType = mode === "edit" ? (editingNode?.type ?? "planta") : (childType ?? "planta");
  const showGeo = GEO_TYPES.includes(nodeType);

  React.useEffect(() => {
    if (open) {
      setError(""); setGeoError("");
      if (mode === "edit" && editingNode) {
        setName(editingNode.name);
        setDescription(editingNode.description);
        setLatStr(editingNode.lat != null ? String(editingNode.lat) : "");
        setLngStr(editingNode.lng != null ? String(editingNode.lng) : "");
      } else {
        setName(""); setDescription(""); setLatStr(""); setLngStr("");
      }
    }
  }, [open, mode, editingNode]);

  const title = mode === "edit"
    ? `Editar ${TYPE_LABEL[nodeType]}`
    : `Nuevo ${TYPE_LABEL[childType ?? "planta"]}`;

  const handleSubmit = () => {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    let lat: number | undefined;
    let lng: number | undefined;
    if (showGeo && (latStr || lngStr)) {
      const parsedLat = parseFloat(latStr);
      const parsedLng = parseFloat(lngStr);
      if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
        setGeoError("Coordenadas inválidas. Latitud: −90…90, Longitud: −180…180");
        return;
      }
      lat = parsedLat; lng = parsedLng;
    }
    onSubmit(name.trim(), description.trim(), lat, lng);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "add" && parentNode && `Añadiendo bajo "${parentNode.name}"`}
            {mode === "edit" && editingNode && `Modificando "${editingNode.name}"`}
            {mode === "add" && !parentNode && "Nueva planta raíz"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder={childType ? `Ej. ${TYPE_LABEL[childType]} 01` : "Nombre"}
              className={error ? "border-red-400" : ""} autoFocus />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción opcional" />
          </div>

          {showGeo && (
            <div className="space-y-1 rounded-lg border border-dashed border-slate-200 p-3">
              <div className="mb-2 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">Geolocalización</span>
                <span className="text-xs text-slate-400">(opcional)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Latitud</Label>
                  <Input
                    value={latStr}
                    onChange={(e) => { setLatStr(e.target.value); setGeoError(""); }}
                    placeholder="Ej. 43.2627"
                    className={`text-xs ${geoError ? "border-red-400" : ""}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Longitud</Label>
                  <Input
                    value={lngStr}
                    onChange={(e) => { setLngStr(e.target.value); setGeoError(""); }}
                    placeholder="Ej. -2.9253"
                    className={`text-xs ${geoError ? "border-red-400" : ""}`}
                  />
                </div>
              </div>
              {geoError && <p className="text-xs text-red-500">{geoError}</p>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>{mode === "edit" ? "Guardar" : "Crear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Tree Node component ────────────────────────────────────────────────────────
function TreeNodeRow({
  node, depth, onEdit, onDelete, onAddChild,
}: {
  node: AssetNode; depth: number;
  onEdit: (node: AssetNode) => void;
  onDelete: (node: AssetNode) => void;
  onAddChild: (parent: AssetNode) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const canHaveChildren = TYPE_ORDER.indexOf(node.type) < TYPE_ORDER.length - 1;

  return (
    <div>
      <div
        className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {/* Icon + type badge */}
        <span className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[node.type]}`}>
          {TYPE_ICON[node.type]}
          {TYPE_LABEL[node.type]}
        </span>

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-slate-800 truncate">{node.name}</span>

        {/* Description */}
        {node.description && (
          <span className="hidden lg:block text-xs text-slate-400 truncate max-w-[180px]">{node.description}</span>
        )}

        {/* Geo indicator */}
        {(node.lat != null && node.lng != null) && (
          <span className="hidden lg:flex items-center gap-1 text-xs text-sky-500 shrink-0" title={`${node.lat}, ${node.lng}`}>
            <MapPin className="h-3 w-3" />
          </span>
        )}

        {/* Child count */}
        {hasChildren && (
          <Badge variant="secondary" className="text-xs shrink-0">{node.children.length}</Badge>
        )}

        {/* Actions (shown on hover) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {canHaveChildren && (
            <Button variant="ghost" size="icon-xs" onClick={() => onAddChild(node)}
              title={`Añadir ${TYPE_LABEL[TYPE_ORDER[TYPE_ORDER.indexOf(node.type) + 1]]}`}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon-xs" onClick={() => onEdit(node)} title="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" className="hover:text-red-600" onClick={() => onDelete(node)} title="Eliminar">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="border-l border-slate-200 ml-[20px]">
          {node.children.map((child) => (
            <TreeNodeRow key={child.id} node={child} depth={depth + 1}
              onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function JerarquiaPage() {
  const [tree, setTree] = useState<AssetNode[]>(INITIAL_TREE);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [parentNode, setParentNode] = useState<AssetNode | null>(null);
  const [editingNode, setEditingNode] = useState<AssetNode | null>(null);

  const openAdd = useCallback((parent: AssetNode | null) => {
    setMode("add"); setParentNode(parent); setEditingNode(null); setDialogOpen(true);
  }, []);

  const openEdit = useCallback((node: AssetNode) => {
    setMode("edit"); setParentNode(null); setEditingNode(node); setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((node: AssetNode) => {
    const msg = node.children.length > 0
      ? `¿Eliminar "${node.name}" y todos sus ${node.children.length} hijo(s)?`
      : `¿Eliminar "${node.name}"?`;
    if (window.confirm(msg)) setTree((t) => deleteNode(t, node.id));
  }, []);

  const handleSubmit = useCallback((name: string, description: string, lat?: number, lng?: number) => {
    if (mode === "edit" && editingNode) {
      setTree((t) => updateNode(t, editingNode.id, { name, description, lat, lng }));
    } else {
      const childType = parentNode
        ? TYPE_ORDER[TYPE_ORDER.indexOf(parentNode.type) + 1]
        : "planta";
      const newNode: AssetNode = { id: nextId(), name, type: childType!, description, lat, lng, children: [] };
      if (parentNode) setTree((t) => addChild(t, parentNode.id, newNode));
      else setTree((t) => [...t, newNode]);
    }
  }, [mode, editingNode, parentNode]);

  const total = countNodes(tree);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Jerarquía de Activos</h1>
            <p className="mt-1 text-sm text-slate-500">
              Define la estructura organizativa de plantas, áreas, secciones y equipos.
            </p>
          </div>
          <Button onClick={() => openAdd(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Planta
          </Button>
        </div>
        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-3">
          {(["planta", "area", "seccion", "equipo"] as AssetNodeType[]).map((t) => (
            <div key={t} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[t]}`}>
                {TYPE_ICON[t]}{TYPE_LABEL[t]}
              </span>
              <span className="text-lg font-bold text-slate-700">{countByType(tree, t)}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
            <span className="text-xs text-slate-500">Total nodos</span>
            <span className="text-lg font-bold text-slate-700">{total}</span>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {tree.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <p className="text-sm text-slate-500">No hay nodos en la jerarquía.</p>
            <p className="text-xs text-slate-400">Haz clic en "Nueva Planta" para empezar.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* Column headers */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-2 text-xs font-medium text-slate-500 mb-2">
              <span style={{ paddingLeft: "34px" }} className="flex-1">Nodo</span>
              <span className="hidden lg:block w-48">Descripción</span>
              <span className="w-14 text-center">Hijos</span>
              <span className="w-24 text-center">Acciones</span>
            </div>
            {tree.map((root) => (
              <TreeNodeRow
                key={root.id}
                node={root}
                depth={0}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAddChild={openAdd}
              />
            ))}
          </div>
        )}
      </div>

      <NodeFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        mode={mode}
        parentNode={parentNode}
        editingNode={editingNode}
      />
    </section>
  );
}
