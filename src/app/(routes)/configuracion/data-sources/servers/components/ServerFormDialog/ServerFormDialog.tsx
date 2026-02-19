"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DriverType } from "../../types/server.types";
import {
  SecurityPolicy,
  SecurityMode,
  LoginMode,
  ModbusProtocol,
  DataEncoding,
  TLSMode,
  DBType,
  HTTPMethod,
  AuthType,
  FileType,
  QualityStatus,
  TimestampSource,
  type CommonDriverConfig,
  type OPCUAConfig,
  type ModbusTCPConfig,
  type MQTTConfig,
  type OPCDAConfig,
  type DataBaseSQLConfig,
  type APIRESTConfig,
  type ImportFileConfig,
  type ManualConfig,
} from "../../types/driver-config.types";
import type { DriverConfig } from "../../types/driver-config.types";
import type { ServerFormDialogProps } from "./ServerFormDialog.types";

type TabId = "general" | "configuracion";

export function ServerFormDialog({
  open,
  onClose,
  onSubmit,
  editingServer,
}: ServerFormDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>("general");

  // ── General ──────────────────────────────────────────────────────────────────
  const [enable, setEnable] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [driver, setDriver] = useState<DriverType | "">("");

  // ── Common driver params ─────────────────────────────────────────────────────
  const [heartbeatInterval, setHeartbeatInterval] = useState(30);
  const [maxRetries, setMaxRetries] = useState(3);
  const [connectTimeout, setConnectTimeout] = useState(5);
  const [storeAndForwardEnabled, setStoreAndForwardEnabled] = useState(false);

  // ── OPC UA ────────────────────────────────────────────────────────────────────
  const [opcuaServerUrl, setOpcuaServerUrl] = useState("");
  const [securityPolicy, setSecurityPolicy] = useState<SecurityPolicy>(SecurityPolicy.NONE);
  const [securityMode, setSecurityMode] = useState<SecurityMode>(SecurityMode.SIGN);
  const [loginMode, setLoginMode] = useState<LoginMode>(LoginMode.ANONYMOUS);
  const [loginName, setLoginName] = useState("");
  const [opcuaPassword, setOpcuaPassword] = useState("");

  // ── Modbus TCP ────────────────────────────────────────────────────────────────
  const [serverIp, setServerIp] = useState("");
  const [modbusPort, setModbusPort] = useState(502);
  const [protocol, setProtocol] = useState<ModbusProtocol>(ModbusProtocol.TCP);
  const [unitId, setUnitId] = useState(1);
  const [requestTimeoutMs, setRequestTimeoutMs] = useState<number | "">("");
  const [dataEncoding, setDataEncoding] = useState<DataEncoding>(DataEncoding.ABCD);

  // ── MQTT ──────────────────────────────────────────────────────────────────────
  const [mqttServerUrl, setMqttServerUrl] = useState("");
  const [mqttPort, setMqttPort] = useState(8883);
  const [tlsMode, setTlsMode] = useState<TLSMode>(TLSMode.ACTIVATE);
  const [mqttUserName, setMqttUserName] = useState("");
  const [mqttPassword, setMqttPassword] = useState("");
  const [clientId, setClientId] = useState("");
  const [keepAlive, setKeepAlive] = useState(60);

  // ── OPC DA ────────────────────────────────────────────────────────────────────
  const [opcdaServerName, setOpcdaServerName] = useState("");
  const [opcdaServerHost, setOpcdaServerHost] = useState("");
  const [dcomUser, setDcomUser] = useState("");
  const [dcomPassword, setDcomPassword] = useState("");
  const [updateRate, setUpdateRate] = useState(1000);
  const [groupDeadband, setGroupDeadband] = useState<number | "">("");

  // ── Data Base SQL ─────────────────────────────────────────────────────────────
  const [dbType, setDbType] = useState<DBType>(DBType.POSTGRESQL);
  const [sqlServerHost, setSqlServerHost] = useState("");
  const [sqlPort, setSqlPort] = useState(5432);
  const [databaseName, setDatabaseName] = useState("");
  const [sqlUsername, setSqlUsername] = useState("");
  const [sqlPassword, setSqlPassword] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [pollingInterval, setPollingInterval] = useState(60);
  const [timestampColumn, setTimestampColumn] = useState("");
  const [valueColumns, setValueColumns] = useState("");

  // ── API REST ──────────────────────────────────────────────────────────────────
  const [endpointUrl, setEndpointUrl] = useState("");
  const [httpMethod, setHttpMethod] = useState<HTTPMethod>(HTTPMethod.GET);
  const [authType, setAuthType] = useState<AuthType>(AuthType.NONE);
  const [authValue, setAuthValue] = useState("");
  const [apiPollingInterval, setApiPollingInterval] = useState(60);
  const [payloadMapping, setPayloadMapping] = useState("");
  const [timestampSource, setTimestampSource] = useState<TimestampSource>(TimestampSource.PAYLOAD);

  // ── Import File ───────────────────────────────────────────────────────────────
  const [fileType, setFileType] = useState<FileType>(FileType.CSV);
  const [delimiter, setDelimiter] = useState(",");
  const [headerRow, setHeaderRow] = useState(true);
  const [fileEncoding, setFileEncoding] = useState("UTF-8");
  const [fileTimestampColumn, setFileTimestampColumn] = useState("");
  const [fileValueColumns, setFileValueColumns] = useState("");
  const [tagMapping, setTagMapping] = useState("");
  const [defaultQuality, setDefaultQuality] = useState<QualityStatus>(QualityStatus.MANUAL);

  // ── Manual ────────────────────────────────────────────────────────────────────
  const [enableManualInput, setEnableManualInput] = useState(true);
  const [allowedUsersRoles, setAllowedUsersRoles] = useState("");
  const [defaultQualitySource, setDefaultQualitySource] = useState<QualityStatus>(QualityStatus.MANUAL);
  const [defaultQualityStatus, setDefaultQualityStatus] = useState<QualityStatus>(QualityStatus.GOOD);
  const [approvalRequired, setApprovalRequired] = useState(false);

  // ── Errors ────────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState({ name: "", description: "", driver: "" });

  // ── Load existing ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setActiveTab("general");
    setErrors({ name: "", description: "", driver: "" });

    const cfg = (editingServer?.driverConfig ?? {}) as any;

    if (editingServer) {
      setEnable(editingServer.enable);
      setName(editingServer.name);
      setDescription(editingServer.description);
      setDriver(editingServer.driver);
    } else {
      setEnable(true);
      setName(""); setDescription(""); setDriver("");
    }

    // Common
    setHeartbeatInterval(cfg?.heartbeatInterval ?? 30);
    setMaxRetries(cfg?.retryPolicy?.maxRetries ?? 3);
    setConnectTimeout(cfg?.connectTimeout ?? 5);
    setStoreAndForwardEnabled(cfg?.storeAndForward?.enabled ?? false);

    const d = editingServer?.driver;
    if (d === DriverType.OPC_UA) {
      setOpcuaServerUrl(cfg?.serverUrl ?? "");
      setSecurityPolicy(cfg?.securityPolicy ?? SecurityPolicy.NONE);
      setSecurityMode(cfg?.securityMode ?? SecurityMode.SIGN);
      setLoginMode(cfg?.loginMode ?? LoginMode.ANONYMOUS);
      setLoginName(cfg?.loginName ?? "");
      setOpcuaPassword(cfg?.password ?? "");
    } else if (d === DriverType.MODBUS_TCP) {
      setServerIp(cfg?.serverIp ?? "");
      setModbusPort(cfg?.port ?? 502);
      setProtocol(cfg?.protocol ?? ModbusProtocol.TCP);
      setUnitId(cfg?.unitId ?? 1);
      setRequestTimeoutMs(cfg?.requestTimeoutMs ?? "");
      setDataEncoding(cfg?.dataEncoding ?? DataEncoding.ABCD);
    } else if (d === DriverType.MQTT) {
      setMqttServerUrl(cfg?.serverUrl ?? "");
      setMqttPort(cfg?.port ?? 8883);
      setTlsMode(cfg?.tls ?? TLSMode.ACTIVATE);
      setMqttUserName(cfg?.userName ?? "");
      setMqttPassword(cfg?.password ?? "");
      setClientId(cfg?.clientId ?? "");
      setKeepAlive(cfg?.keepAlive ?? 60);
    } else if (d === DriverType.OPC_DA) {
      setOpcdaServerName(cfg?.serverName ?? "");
      setOpcdaServerHost(cfg?.serverHost ?? "");
      setDcomUser(cfg?.dcomUser ?? "");
      setDcomPassword(cfg?.dcomPassword ?? "");
      setUpdateRate(cfg?.updateRate ?? 1000);
      setGroupDeadband(cfg?.groupDeadband ?? "");
    } else if (d === DriverType.DATA_BASE_SQL) {
      setDbType(cfg?.dbType ?? DBType.POSTGRESQL);
      setSqlServerHost(cfg?.serverHost ?? "");
      setSqlPort(cfg?.port ?? 5432);
      setDatabaseName(cfg?.databaseName ?? "");
      setSqlUsername(cfg?.username ?? "");
      setSqlPassword(cfg?.password ?? "");
      setSqlQuery(cfg?.query ?? "");
      setPollingInterval(cfg?.pollingInterval ?? 60);
      setTimestampColumn(cfg?.timestampColumn ?? "");
      setValueColumns(cfg?.valueColumns ?? "");
    } else if (d === DriverType.API_REST) {
      setEndpointUrl(cfg?.endpointUrl ?? "");
      setHttpMethod(cfg?.httpMethod ?? HTTPMethod.GET);
      setAuthType(cfg?.authenticationType ?? AuthType.NONE);
      setAuthValue(cfg?.authenticationValue ?? "");
      setApiPollingInterval(cfg?.pollingInterval ?? 60);
      setPayloadMapping(cfg?.payloadMapping ?? "");
      setTimestampSource(cfg?.timestampSource ?? TimestampSource.PAYLOAD);
    } else if (d === DriverType.IMPORT_FILE) {
      setFileType(cfg?.fileType ?? FileType.CSV);
      setDelimiter(cfg?.delimiter ?? ",");
      setHeaderRow(cfg?.headerRow ?? true);
      setFileEncoding(cfg?.encoding ?? "UTF-8");
      setFileTimestampColumn(cfg?.timestampColumn ?? "");
      setFileValueColumns(cfg?.valueColumns ?? "");
      setTagMapping(cfg?.tagMapping ?? "");
      setDefaultQuality(cfg?.defaultQuality ?? QualityStatus.MANUAL);
    } else if (d === DriverType.MANUAL) {
      setEnableManualInput(cfg?.enableManualInput ?? true);
      setAllowedUsersRoles((cfg?.allowedUsersRoles ?? []).join(", "));
      setDefaultQualitySource(cfg?.defaultQualitySource ?? QualityStatus.MANUAL);
      setDefaultQualityStatus(cfg?.defaultQualityStatus ?? QualityStatus.GOOD);
      setApprovalRequired(cfg?.approvalRequired ?? false);
    }
  }, [editingServer, open]);

  // ── Build driver config from current state ────────────────────────────────────
  const buildDriverConfig = (): DriverConfig | undefined => {
    if (!driver) return undefined;
    const common: CommonDriverConfig = {
      heartbeatInterval,
      retryPolicy: { maxRetries, backoffMultiplier: 2, maxReconnectTime: 300 },
      connectTimeout,
      storeAndForward: { enabled: storeAndForwardEnabled, preserveTimestamps: true },
    };
    switch (driver) {
      case DriverType.OPC_UA: {
        const config: OPCUAConfig = {
          ...common,
          serverUrl: opcuaServerUrl,
          securityPolicy, securityMode, loginMode,
          ...(loginMode === LoginMode.USERNAME && { loginName, password: opcuaPassword }),
        };
        return config;
      }
      case DriverType.MODBUS_TCP: {
        const config: ModbusTCPConfig = {
          ...common, serverIp, port: modbusPort, protocol, unitId,
          ...(requestTimeoutMs !== "" && { requestTimeoutMs: Number(requestTimeoutMs) }),
          dataEncoding,
        };
        return config;
      }
      case DriverType.MQTT: {
        const config: MQTTConfig = {
          ...common, serverUrl: mqttServerUrl, port: mqttPort, tls: tlsMode,
          ...(mqttUserName && { userName: mqttUserName }),
          ...(mqttPassword && { password: mqttPassword }),
          clientId, keepAlive,
        };
        return config;
      }
      case DriverType.OPC_DA: {
        const config: OPCDAConfig = {
          ...common, serverName: opcdaServerName, serverHost: opcdaServerHost,
          ...(dcomUser && { dcomUser }),
          ...(dcomPassword && { dcomPassword }),
          updateRate,
          ...(groupDeadband !== "" && { groupDeadband: Number(groupDeadband) }),
        };
        return config;
      }
      case DriverType.DATA_BASE_SQL: {
        const config: DataBaseSQLConfig = {
          ...common, dbType, serverHost: sqlServerHost, port: sqlPort,
          databaseName, username: sqlUsername, password: sqlPassword,
          query: sqlQuery, pollingInterval, timestampColumn, valueColumns,
        };
        return config;
      }
      case DriverType.API_REST: {
        const config: APIRESTConfig = {
          ...common, endpointUrl, httpMethod,
          authenticationType: authType,
          ...(authValue && { authenticationValue: authValue }),
          pollingInterval: apiPollingInterval, payloadMapping, timestampSource,
        };
        return config;
      }
      case DriverType.IMPORT_FILE: {
        const config: ImportFileConfig = {
          ...common, fileType,
          ...(fileType === FileType.CSV && { delimiter }),
          headerRow, encoding: fileEncoding,
          timestampColumn: fileTimestampColumn,
          valueColumns: fileValueColumns,
          tagMapping, defaultQuality,
        };
        return config;
      }
      case DriverType.MANUAL: {
        const config: ManualConfig = {
          ...common, enableManualInput,
          allowedUsersRoles: allowedUsersRoles.split(",").map((s) => s.trim()).filter(Boolean),
          defaultQualitySource, defaultQualityStatus, approvalRequired,
        };
        return config;
      }
      default:
        return common;
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = { name: "", description: "", driver: "" };
    let isValid = true;
    if (!name || name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres"; isValid = false;
    }
    if (!description || description.trim().length < 3) {
      newErrors.description = "La descripción debe tener al menos 3 caracteres"; isValid = false;
    }
    if (!driver) {
      newErrors.driver = "Debes seleccionar un driver"; isValid = false;
    }
    setErrors(newErrors);
    if (!isValid) setActiveTab("general");
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      enable,
      name: name.trim(),
      description: description.trim(),
      driver: driver as DriverType,
      driverConfig: buildDriverConfig(),
    });
    onClose();
  };

  const isEdit = !!editingServer;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent key={editingServer?.id ?? "new"} className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Servidor" : "Agregar Servidor"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifica la configuración del servidor" : "Configura una nueva conexión a fuente de datos"}
          </DialogDescription>
        </DialogHeader>

        {/* Tab navigation */}
        <div className="flex gap-1 border-b border-slate-200">
          {(["general", "configuracion"] as TabId[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px capitalize ${
                activeTab === tab
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "general" ? "General" : "Configuración"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">

            {/* ── Tab General ─────────────────────────────────────────────── */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="enable" checked={enable} onCheckedChange={(c) => setEnable(c as boolean)} />
                  <Label htmlFor="enable">Habilitar conexión</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Ej: PLC-001"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Input
                    id="description"
                    placeholder="Ej: Controlador principal línea de producción 1"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver">Driver</Label>
                  <Select
                    value={driver}
                    onValueChange={(value) => setDriver(value as DriverType)}
                  >
                    <SelectTrigger className={errors.driver ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecciona un driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(DriverType).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.driver && <p className="text-xs text-red-500">{errors.driver}</p>}
                  {driver && (
                    <p className="text-xs text-slate-500">
                      Configura los parámetros del driver en la pestaña <span className="font-medium">Configuración</span>.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab Configuración ────────────────────────────────────────── */}
            {activeTab === "configuracion" && (
              <div className="space-y-4">
                {!driver ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    Selecciona un driver en la pestaña <span className="font-medium">General</span> para ver las opciones de configuración.
                  </p>
                ) : (
                  <>
                    {/* Parámetros Comunes */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-slate-700">Parámetros Comunes</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Heartbeat Interval (s)</Label>
                          <Input type="number" value={heartbeatInterval} onChange={(e) => setHeartbeatInterval(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Retries</Label>
                          <Input type="number" value={maxRetries} onChange={(e) => setMaxRetries(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Connect Timeout (s)</Label>
                          <Input type="number" value={connectTimeout} onChange={(e) => setConnectTimeout(Number(e.target.value))} />
                        </div>
                        <div className="flex items-center space-x-2 pt-7">
                          <Checkbox id="storeForward" checked={storeAndForwardEnabled} onCheckedChange={(c) => setStoreAndForwardEnabled(c as boolean)} />
                          <Label htmlFor="storeForward">Store &amp; Forward</Label>
                        </div>
                      </div>
                    </div>

                    {/* OPC UA */}
                    {driver === DriverType.OPC_UA && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700">Configuración OPC UA</h3>
                        <div className="space-y-2">
                          <Label>Server URL *</Label>
                          <Input placeholder="opc.tcp://127.0.0.1:49320" value={opcuaServerUrl} onChange={(e) => setOpcuaServerUrl(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Security Policy *</Label>
                            <Select value={securityPolicy} onValueChange={(v) => setSecurityPolicy(v as SecurityPolicy)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.values(SecurityPolicy).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Security Mode *</Label>
                            <Select value={securityMode} onValueChange={(v) => setSecurityMode(v as SecurityMode)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.values(SecurityMode).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Login Mode *</Label>
                          <Select value={loginMode} onValueChange={(v) => setLoginMode(v as LoginMode)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{Object.values(LoginMode).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {loginMode === LoginMode.USERNAME && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Login Name *</Label>
                              <Input value={loginName} onChange={(e) => setLoginName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Password *</Label>
                              <Input type="password" value={opcuaPassword} onChange={(e) => setOpcuaPassword(e.target.value)} />
                            </div>
                          </div>
                        )}
                        {loginMode === LoginMode.CERTIFICATE && (
                          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs text-amber-700">La carga de certificados (.pem/.der) se configurará mediante el gestor de certificados.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Modbus TCP */}
                    {driver === DriverType.MODBUS_TCP && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700">Configuración Modbus TCP</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Server IP *</Label>
                            <Input placeholder="192.168.1.20" value={serverIp} onChange={(e) => setServerIp(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Port *</Label>
                            <Input type="number" value={modbusPort} onChange={(e) => setModbusPort(Number(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Protocol *</Label>
                            <Select value={protocol} onValueChange={(v) => setProtocol(v as ModbusProtocol)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.values(ModbusProtocol).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Unit-ID *</Label>
                            <Input type="number" value={unitId} onChange={(e) => setUnitId(Number(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Request Timeout (ms)</Label>
                            <Input type="number" placeholder="—" value={requestTimeoutMs} onChange={(e) => setRequestTimeoutMs(e.target.value === "" ? "" : Number(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Data Encoding *</Label>
                            <Select value={dataEncoding} onValueChange={(v) => setDataEncoding(v as DataEncoding)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.values(DataEncoding).map((enc) => <SelectItem key={enc} value={enc}>{enc}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MQTT */}
                    {driver === DriverType.MQTT && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700">Configuración MQTT</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Server URL *</Label>
                            <Input placeholder="test.mosquitto.org" value={mqttServerUrl} onChange={(e) => setMqttServerUrl(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Port *</Label>
                            <Input type="number" value={mqttPort} onChange={(e) => setMqttPort(Number(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                            <Label>TLS *</Label>
                            <Select value={tlsMode} onValueChange={(v) => setTlsMode(v as TLSMode)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.values(TLSMode).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Client ID *</Label>
                            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>User Name</Label>
                            <Input value={mqttUserName} onChange={(e) => setMqttUserName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Password</Label>
                            <Input type="password" value={mqttPassword} onChange={(e) => setMqttPassword(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Keep Alive (s) *</Label>
                            <Input type="number" value={keepAlive} onChange={(e) => setKeepAlive(Number(e.target.value))} />
                          </div>
                        </div>
                        {tlsMode === TLSMode.ACTIVATE && (
                          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                            <p className="text-xs text-blue-700">TLS activado. Los certificados se gestionarán mediante el gestor de certificados del sistema.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* OPC DA */}
                    {driver === DriverType.OPC_DA && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700">Configuración OPC DA</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Server Name / ProgID *</Label>
                            <Input placeholder="Matrikon.OPC.Simulation.1" value={opcdaServerName} onChange={(e) => setOpcdaServerName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Server Host *</Label>
                            <Input placeholder="192.168.1.10" value={opcdaServerHost} onChange={(e) => setOpcdaServerHost(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>DCOM User</Label>
                            <Input value={dcomUser} onChange={(e) => setDcomUser(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>DCOM Password</Label>
                            <Input type="password" value={dcomPassword} onChange={(e) => setDcomPassword(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Update Rate (ms) *</Label>
                            <Input type="number" value={updateRate} onChange={(e) => setUpdateRate(Number(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Group Deadband (%)</Label>
                            <Input type="number" step="0.1" placeholder="—" value={groupDeadband} onChange={(e) => setGroupDeadband(e.target.value === "" ? "" : Number(e.target.value))} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Data Base SQL */}
                    {driver === DriverType.DATA_BASE_SQL && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700">Configuración Data Base SQL</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>DB Type *</Label>
                            <Select value={dbType} onValueChange={(v) => { setDbType(v as DBType); setSqlPort(v === DBType.POSTGRESQL ? 5432 : v === DBType.MYSQL ? 3306 : 1433); }}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.values(DBType).map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Server Host *</Label>
                            <Input placeholder="192.168.1.10" value={sqlServerHost} onChange={(e) => setSqlServerHost(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Port *</Label>
                            <Input type="number" value={sqlPort} onChange={(e) => setSqlPort(Number(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Database Name *</Label>
                            <Input value={databaseName} onChange={(e) => setDatabaseName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Username *</Label>
                            <Input value={sqlUsername} onChange={(e) => setSqlUsername(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Password *</Label>
                            <Input type="password" value={sqlPassword} onChange={(e) => setSqlPassword(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Polling Interval (s) *</Label>
                            <Input type="number" value={pollingInterval} onChange={(e) => setPollingInterval(Number(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Timestamp Column *</Label>
                            <Input placeholder="timestamp" value={timestampColumn} onChange={(e) => setTimestampColumn(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Value Column(s) *</Label>
                          <Input placeholder="value, temperature, pressure" value={valueColumns} onChange={(e) => setValueColumns(e.target.value)} />
                          <p className="text-xs text-slate-500">Separadas por coma si hay varias columnas.</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Query SQL *</Label>
                          <Textarea rows={4} placeholder="SELECT timestamp, value FROM measurements WHERE timestamp > :last_ts ORDER BY timestamp" value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)} className="font-mono text-xs" />
                          <p className="text-xs text-slate-500">Solo consultas de lectura (SELECT).</p>
                        </div>
                      </div>
                    )}

                    {/* API REST */}
                    {driver === DriverType.API_REST && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700">Configuración API REST</h3>
                        <div className="space-y-2">
                          <Label>Endpoint URL *</Label>
                          <Input placeholder="https://api.example.com/data" value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>HTTP Method *</Label>
                            <Select value={httpMethod} onValueChange={(v) => setHttpMethod(v as HTTPMethod)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.values(HTTPMethod).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Authentication Type *</Label>
                            <Select value={authType} onValueChange={(v) => setAuthType(v as AuthType)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.values(AuthType).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          {authType !== AuthType.NONE && (
                            <div className="col-span-2 space-y-2">
                              <Label>{authType === AuthType.API_KEY ? "API Key" : authType === AuthType.BEARER_TOKEN ? "Bearer Token" : "OAuth Value"} *</Label>
                              <Input type="password" value={authValue} onChange={(e) => setAuthValue(e.target.value)} />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Polling Interval (s) *</Label>
                            <Input type="number" value={apiPollingInterval} onChange={(e) => setApiPollingInterval(Number(e.target.value))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Timestamp Source *</Label>
                            <Select value={timestampSource} onValueChange={(v) => setTimestampSource(v as TimestampSource)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.values(TimestampSource).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Payload Mapping (JSON) *</Label>
                          <Textarea rows={4} placeholder={'{\n  "temperature": "tag-uuid-001"\n}'} value={payloadMapping} onChange={(e) => setPayloadMapping(e.target.value)} className="font-mono text-xs" />
                          <p className="text-xs text-slate-500">Mapeo campo JSON → TagUUID.</p>
                        </div>
                      </div>
                    )}

                    {/* Import File */}
                    {driver === DriverType.IMPORT_FILE && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700">Configuración Import File</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>File Type *</Label>
                            <Select value={fileType} onValueChange={(v) => setFileType(v as FileType)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.values(FileType).map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          {fileType === FileType.CSV && (
                            <div className="space-y-2">
                              <Label>Delimiter *</Label>
                              <Input placeholder="," value={delimiter} onChange={(e) => setDelimiter(e.target.value)} maxLength={1} />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Encoding</Label>
                            <Select value={fileEncoding} onValueChange={setFileEncoding}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UTF-8">UTF-8</SelectItem>
                                <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                                <SelectItem value="Windows-1252">Windows-1252</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Default Quality *</Label>
                            <Select value={defaultQuality} onValueChange={(v) => setDefaultQuality(v as QualityStatus)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value={QualityStatus.MANUAL}>Manual</SelectItem>
                                <SelectItem value={QualityStatus.ESTIMATED}>Estimated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Timestamp Column *</Label>
                            <Input placeholder="timestamp" value={fileTimestampColumn} onChange={(e) => setFileTimestampColumn(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Value Column(s) *</Label>
                            <Input placeholder="value, col2" value={fileValueColumns} onChange={(e) => setFileValueColumns(e.target.value)} />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="headerRow" checked={headerRow} onCheckedChange={(c) => setHeaderRow(c as boolean)} />
                          <Label htmlFor="headerRow">El archivo contiene fila de cabecera</Label>
                        </div>
                        <div className="space-y-2">
                          <Label>Tag Mapping *</Label>
                          <Textarea rows={3} placeholder={'{\n  "value": "tag-uuid-001"\n}'} value={tagMapping} onChange={(e) => setTagMapping(e.target.value)} className="font-mono text-xs" />
                          <p className="text-xs text-slate-500">Columna → TagUUID.</p>
                        </div>
                      </div>
                    )}

                    {/* Manual */}
                    {driver === DriverType.MANUAL && (
                      <div className="space-y-4 border-t pt-4">
                        <h3 className="text-sm font-semibold text-slate-700">Configuración Manual</h3>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="enableManual" checked={enableManualInput} onCheckedChange={(c) => setEnableManualInput(c as boolean)} />
                          <Label htmlFor="enableManual">Enable Manual Input</Label>
                        </div>
                        <div className="space-y-2">
                          <Label>Allowed Users / Roles *</Label>
                          <Input placeholder="admin, operator, analyst" value={allowedUsersRoles} onChange={(e) => setAllowedUsersRoles(e.target.value)} />
                          <p className="text-xs text-slate-500">Separados por coma.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Default Quality Source *</Label>
                            <Select value={defaultQualitySource} onValueChange={(v) => setDefaultQualitySource(v as QualityStatus)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value={QualityStatus.MANUAL}>Manual</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Default Quality Status *</Label>
                            <Select value={defaultQualityStatus} onValueChange={(v) => setDefaultQualityStatus(v as QualityStatus)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value={QualityStatus.GOOD}>Good</SelectItem>
                                <SelectItem value={QualityStatus.UNCERTAIN}>Uncertain</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="approvalRequired" checked={approvalRequired} onCheckedChange={(c) => setApprovalRequired(c as boolean)} />
                          <Label htmlFor="approvalRequired">Approval Required</Label>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs text-slate-600">Todo dato manual incluirá TagUUID + timestamp y quedará registrado en la auditoría del sistema.</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{isEdit ? "Guardar cambios" : "Agregar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
