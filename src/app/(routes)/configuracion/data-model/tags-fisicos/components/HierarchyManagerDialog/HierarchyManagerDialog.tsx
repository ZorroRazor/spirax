"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { HierarchyTree } from "../../types/hierarchy.data";

interface HierarchyManagerDialogProps {
  open: boolean;
  onClose: () => void;
  hierarchyData: HierarchyTree;
  onChange: (data: HierarchyTree) => void;
}

type EditTarget = { col: "planta" | "area" | "seccion" | "equipo"; index: number };

export function HierarchyManagerDialog({
  open,
  onClose,
  hierarchyData,
  onChange,
}: HierarchyManagerDialogProps) {
  const [local, setLocal] = useState<HierarchyTree>({});
  const [selPlanta, setSelPlanta] = useState<string | null>(null);
  const [selArea, setSelArea] = useState<string | null>(null);
  const [selSeccion, setSelSeccion] = useState<string | null>(null);

  // Inline add state per column
  const [addingIn, setAddingIn] = useState<"planta" | "area" | "seccion" | "equipo" | null>(null);
  const [addValue, setAddValue] = useState("");

  // Inline edit state
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [editValue, setEditValue] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      // Deep copy
      const copy: HierarchyTree = {};
      for (const p in hierarchyData) {
        copy[p] = {};
        for (const a in hierarchyData[p]) {
          copy[p][a] = {};
          for (const s in hierarchyData[p][a]) {
            copy[p][a][s] = [...hierarchyData[p][a][s]];
          }
        }
      }
      setLocal(copy);
      setSelPlanta(null); setSelArea(null); setSelSeccion(null);
      setAddingIn(null); setAddValue(""); setEditing(null); setEditValue(""); setError("");
    }
  }, [open, hierarchyData]);

  // ── Derived lists ──────────────────────────────────────────────────────────
  const plantas = Object.keys(local);
  const areas = selPlanta ? Object.keys(local[selPlanta] ?? {}) : [];
  const secciones = selPlanta && selArea ? Object.keys(local[selPlanta]?.[selArea] ?? {}) : [];
  const equipos = selPlanta && selArea && selSeccion
    ? (local[selPlanta]?.[selArea]?.[selSeccion] ?? [])
    : [];

  // ── Add ──────────────────────────────────────────────────────────────────────
  const startAdd = (col: typeof addingIn) => {
    setAddingIn(col); setAddValue(""); setError(""); setEditing(null);
  };

  const confirmAdd = () => {
    const val = addValue.trim();
    if (!val) return;
    setError("");
    const next = { ...local };

    if (addingIn === "planta") {
      if (next[val]) { setError("Ya existe esa planta"); return; }
      next[val] = {};
      setSelPlanta(val); setSelArea(null); setSelSeccion(null);
    } else if (addingIn === "area" && selPlanta) {
      if (next[selPlanta][val]) { setError("Ya existe esa área"); return; }
      next[selPlanta] = { ...next[selPlanta], [val]: {} };
      setSelArea(val); setSelSeccion(null);
    } else if (addingIn === "seccion" && selPlanta && selArea) {
      if (next[selPlanta][selArea][val]) { setError("Ya existe esa sección"); return; }
      next[selPlanta][selArea] = { ...next[selPlanta][selArea], [val]: [] };
      setSelSeccion(val);
    } else if (addingIn === "equipo" && selPlanta && selArea && selSeccion) {
      if (next[selPlanta][selArea][selSeccion].includes(val)) {
        setError("Ya existe ese equipo"); return;
      }
      next[selPlanta][selArea][selSeccion] = [...next[selPlanta][selArea][selSeccion], val];
    }

    setLocal(next); setAddingIn(null); setAddValue("");
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const startEdit = (col: EditTarget["col"], index: number, current: string) => {
    setEditing({ col, index }); setEditValue(current); setError(""); setAddingIn(null);
  };

  const confirmEdit = () => {
    if (!editing) return;
    const val = editValue.trim();
    if (!val) { setError("No puede estar vacío"); return; }
    setError("");
    const { col, index } = editing;
    const next = { ...local };

    if (col === "planta") {
      const old = plantas[index];
      if (val !== old && next[val]) { setError("Ya existe esa planta"); return; }
      if (val !== old) {
        next[val] = next[old];
        delete next[old];
        if (selPlanta === old) setSelPlanta(val);
      }
    } else if (col === "area" && selPlanta) {
      const old = areas[index];
      if (val !== old && next[selPlanta][val]) { setError("Ya existe esa área"); return; }
      if (val !== old) {
        next[selPlanta][val] = next[selPlanta][old];
        delete next[selPlanta][old];
        if (selArea === old) setSelArea(val);
      }
    } else if (col === "seccion" && selPlanta && selArea) {
      const old = secciones[index];
      if (val !== old && next[selPlanta][selArea][val]) { setError("Ya existe esa sección"); return; }
      if (val !== old) {
        next[selPlanta][selArea][val] = next[selPlanta][selArea][old];
        delete next[selPlanta][selArea][old];
        if (selSeccion === old) setSelSeccion(val);
      }
    } else if (col === "equipo" && selPlanta && selArea && selSeccion) {
      const arr = [...next[selPlanta][selArea][selSeccion]];
      if (arr.includes(val) && arr[index] !== val) { setError("Ya existe ese equipo"); return; }
      arr[index] = val;
      next[selPlanta][selArea][selSeccion] = arr;
    }

    setLocal(next); setEditing(null); setEditValue("");
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteItem = (col: EditTarget["col"], index: number) => {
    const next = { ...local };
    if (col === "planta") {
      const name = plantas[index];
      delete next[name];
      if (selPlanta === name) { setSelPlanta(null); setSelArea(null); setSelSeccion(null); }
    } else if (col === "area" && selPlanta) {
      const name = areas[index];
      delete next[selPlanta][name];
      if (selArea === name) { setSelArea(null); setSelSeccion(null); }
    } else if (col === "seccion" && selPlanta && selArea) {
      const name = secciones[index];
      delete next[selPlanta][selArea][name];
      if (selSeccion === name) setSelSeccion(null);
    } else if (col === "equipo" && selPlanta && selArea && selSeccion) {
      next[selPlanta][selArea][selSeccion] = next[selPlanta][selArea][selSeccion].filter(
        (_, i) => i !== index
      );
    }
    setLocal(next);
  };

  const handleSave = () => { onChange(local); onClose(); };

  // ── Column render helper ──────────────────────────────────────────────────────
  function Column({
    col, title, items, selected, onSelect, canAdd,
  }: {
    col: EditTarget["col"];
    title: string;
    items: string[];
    selected: string | null;
    onSelect: (val: string) => void;
    canAdd: boolean;
  }) {
    return (
      <div className="flex flex-col border-r last:border-r-0 border-slate-200 min-w-0 flex-1">
        <div className="bg-slate-50 border-b border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
          {title}
        </div>
        <div className="flex-1 overflow-y-auto min-h-[160px] max-h-[200px]">
          {items.map((item, i) => (
            <div
              key={i}
              className={`group flex items-center gap-1 px-2 py-1 cursor-pointer transition text-sm ${
                selected === item
                  ? "bg-slate-900 text-white"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
              onClick={() => onSelect(item)}
            >
              {editing?.col === col && editing.index === i ? (
                <Input
                  className="h-5 text-xs flex-1 px-1 py-0"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEdit();
                    if (e.key === "Escape") { setEditing(null); setEditValue(""); }
                  }}
                  autoFocus
                />
              ) : (
                <span className="flex-1 truncate">{item}</span>
              )}

              {editing?.col === col && editing.index === i ? (
                <>
                  <Check className="h-3 w-3 shrink-0 text-green-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); confirmEdit(); }} />
                  <X className="h-3 w-3 shrink-0 text-slate-300 cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditing(null); setEditValue(""); }} />
                </>
              ) : (
                <span className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
                  <Pencil
                    className="h-3 w-3 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); startEdit(col, i, item); }}
                  />
                  <Trash2
                    className="h-3 w-3 cursor-pointer text-red-400"
                    onClick={(e) => { e.stopPropagation(); deleteItem(col, i); }}
                  />
                </span>
              )}
            </div>
          ))}
        </div>

        {canAdd && (
          <div className="border-t border-slate-100 p-1.5">
            {addingIn === col ? (
              <div className="flex gap-1">
                <Input
                  className="h-6 text-xs flex-1"
                  placeholder="Nombre…"
                  value={addValue}
                  onChange={(e) => { setAddValue(e.target.value); setError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmAdd(); if (e.key === "Escape") setAddingIn(null); }}
                  autoFocus
                />
                <Button variant="ghost" size="icon-xs" onClick={confirmAdd}><Check className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon-xs" onClick={() => setAddingIn(null)}><X className="h-3 w-3" /></Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="w-full text-xs h-6 text-slate-500" onClick={() => startAdd(col)}>
                <Plus className="h-3 w-3 mr-1" /> Agregar
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Gestionar Jerarquía de Activos</DialogTitle>
        </DialogHeader>

        {error && <p className="text-xs text-red-500 -mt-2">{error}</p>}

        <div className="flex border border-slate-200 rounded-md overflow-hidden">
          <Column
            col="planta"
            title="Plantas"
            items={plantas}
            selected={selPlanta}
            onSelect={(p) => { setSelPlanta(p); setSelArea(null); setSelSeccion(null); setEditing(null); }}
            canAdd={true}
          />
          <Column
            col="area"
            title="Áreas"
            items={areas}
            selected={selArea}
            onSelect={(a) => { setSelArea(a); setSelSeccion(null); setEditing(null); }}
            canAdd={!!selPlanta}
          />
          <Column
            col="seccion"
            title="Secciones"
            items={secciones}
            selected={selSeccion}
            onSelect={(s) => { setSelSeccion(s); setEditing(null); }}
            canAdd={!!selArea}
          />
          <Column
            col="equipo"
            title="Equipos"
            items={equipos}
            selected={null}
            onSelect={() => {}}
            canAdd={!!selSeccion}
          />
        </div>

        <p className="text-xs text-slate-400">
          Haz clic en un elemento para seleccionarlo y ver / editar los niveles inferiores.
          Los cambios se aplican al guardar.
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSave}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
