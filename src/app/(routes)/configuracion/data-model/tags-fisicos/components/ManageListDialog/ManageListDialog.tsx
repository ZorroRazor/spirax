"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ManageListDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
}

export function ManageListDialog({
  open,
  onClose,
  title,
  items,
  onChange,
}: ManageListDialogProps) {
  const [localItems, setLocalItems] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newItem, setNewItem] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setLocalItems([...items]);
      setEditingIndex(null);
      setEditValue("");
      setNewItem("");
      setError("");
    }
  }, [open, items]);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(localItems[index]);
    setError("");
  };

  const confirmEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) { setError("El valor no puede estar vacío"); return; }
    if (localItems.some((it, i) => it === trimmed && i !== editingIndex)) {
      setError("Ya existe ese valor"); return;
    }
    const next = [...localItems];
    next[editingIndex] = trimmed;
    setLocalItems(next);
    setEditingIndex(null);
    setEditValue("");
    setError("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
    setError("");
  };

  const deleteItem = (index: number) => {
    setLocalItems((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEdit();
  };

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (localItems.includes(trimmed)) { setError("Ya existe ese valor"); return; }
    setLocalItems((prev) => [...prev, trimmed]);
    setNewItem("");
    setError("");
  };

  const handleSave = () => {
    onChange(localItems);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {localItems.length === 0 && (
            <p className="text-xs text-slate-400 py-2 text-center">
              Sin elementos. Añade el primero abajo.
            </p>
          )}
          {localItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              {editingIndex === i ? (
                <>
                  <Input
                    className="h-7 text-sm flex-1"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                    autoFocus
                  />
                  <Button variant="ghost" size="icon-xs" onClick={confirmEdit}>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon-xs" onClick={cancelEdit}>
                    <X className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-700 px-2 py-1">{item}</span>
                  <Button variant="ghost" size="icon-xs" onClick={() => startEdit(i)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteItem(i)}
                    className="hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Add new */}
        <div className="flex gap-2 border-t pt-3">
          <Input
            placeholder="Nuevo elemento…"
            className="h-7 text-sm flex-1"
            value={newItem}
            onChange={(e) => { setNewItem(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") addItem(); }}
          />
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Añadir
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
