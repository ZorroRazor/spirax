"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServersTable } from "./components/ServersTable";
import { ServerFormDialog } from "./components/ServerFormDialog";
import { DriverConfigDialog } from "./components/DriverConfigDialog";
import {
  DriverType,
  Server,
  ServerFormData,
  ServerStatus,
} from "./types/server.types";
import type { DriverConfig } from "./types/driver-config.types";

const MOCK_SERVERS: Server[] = [
  {
    id: 1,
    enable: true,
    name: "PLC-001",
    description: "Controlador principal línea de producción 1",
    driver: DriverType.MODBUS_TCP,
    tagCounter: 145,
    status: ServerStatus.CONNECTED,
    statusMessage: "Online - Last update 2s ago",
  },
  {
    id: 2,
    enable: true,
    name: "HIST-DB-01",
    description: "Base de datos histórica principal",
    driver: DriverType.DATA_BASE_SQL,
    tagCounter: 3200,
    status: ServerStatus.CONNECTED,
    statusMessage: "Syncing - 98% complete",
  },
  {
    id: 3,
    enable: false,
    name: "MQTT-DEV",
    description: "Broker MQTT entorno desarrollo",
    driver: DriverType.MQTT,
    tagCounter: 0,
    status: ServerStatus.DISCONNECTED,
    statusMessage: "Disabled by user",
  },
  {
    id: 4,
    enable: true,
    name: "SCADA-OPC-01",
    description: "Servidor OPC UA sistema SCADA",
    driver: DriverType.OPC_UA,
    tagCounter: 842,
    status: ServerStatus.DEGRADED,
    statusMessage: "High latency detected (>500ms)",
  },
];

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>(MOCK_SERVERS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [isDriverConfigOpen, setIsDriverConfigOpen] = useState(false);
  const [configuringServer, setConfiguringServer] = useState<Server | null>(null);

  const handleAdd = (data: ServerFormData) => {
    const newServer: Server = {
      ...data,
      id: Math.max(...servers.map((s) => s.id), 0) + 1,
      tagCounter: 0,
      status: data.enable ? ServerStatus.CONNECTED : ServerStatus.DISCONNECTED,
      statusMessage: data.enable ? "Newly created" : "Disabled by user",
    };
    setServers([...servers, newServer]);
  };

  const handleEdit = (server: Server) => {
    setEditingServer(server);
    setIsDialogOpen(true);
  };

  const handleUpdate = (data: ServerFormData) => {
    if (!editingServer) return;

    setServers(
      servers.map((s) =>
        s.id === editingServer.id
          ? {
              ...s,
              ...data,
              status: data.enable
                ? ServerStatus.CONNECTED
                : ServerStatus.DISCONNECTED,
              statusMessage: data.enable
                ? "Connection enabled"
                : "Disabled by user",
            }
          : s
      )
    );
    setEditingServer(null);
  };

  const handleDelete = (id: number) => {
    setServers(servers.filter((s) => s.id !== id));
  };

  const handleToggleEnable = (id: number) => {
    setServers(
      servers.map((s) =>
        s.id === id
          ? {
              ...s,
              enable: !s.enable,
              status: !s.enable
                ? ServerStatus.CONNECTED
                : ServerStatus.DISCONNECTED,
              statusMessage: !s.enable ? "Enabled" : "Disabled by user",
            }
          : s
      )
    );
  };

  const handleConfigureDriver = (server: Server) => {
    setConfiguringServer(server);
    setIsDriverConfigOpen(true);
  };

  const handleDriverConfigSave = (config: DriverConfig) => {
    if (!configuringServer) return;

    setServers(
      servers.map((s) =>
        s.id === configuringServer.id
          ? { ...s, driverConfig: config }
          : s
      )
    );
    setIsDriverConfigOpen(false);
    setConfiguringServer(null);
  };

  const handleDriverConfigClose = () => {
    setIsDriverConfigOpen(false);
    setConfiguringServer(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingServer(null);
  };

  const handleDialogSubmit = (data: ServerFormData) => {
    if (editingServer) {
      handleUpdate(data);
    } else {
      handleAdd(data);
    }
  };

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Data Servers</h1>
            <p className="mt-1 text-sm text-slate-600">
              Gestiona conexiones a fuentes de datos externas
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar servidor
          </Button>
        </div>
      </header>

      <ServersTable
        servers={servers}
        onToggleEnable={handleToggleEnable}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onConfigureDriver={handleConfigureDriver}
      />

      <ServerFormDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleDialogSubmit}
        editingServer={editingServer}
      />

      {configuringServer && (
        <DriverConfigDialog
          open={isDriverConfigOpen}
          onClose={handleDriverConfigClose}
          onSave={handleDriverConfigSave}
          server={configuringServer}
        />
      )}
    </section>
  );
}
