// ── Shared types & mock data for Contextos Operativos ─────────────────────────
// Imported by the contextos page AND the KPI form dialog.

export enum ContextType {
  OF               = "Orden de Fabricación",
  LOTE             = "Lote",
  TURNO            = "Turno productivo",
  PARADA           = "Parada programada",
  MODO             = "Modo de operación",
  HORARIO_LABORAL  = "Horario laboral",
  PERIODO_OCUPACION= "Periodo de ocupación",
  HVAC             = "HVAC activo/inactivo",
  EVENTO           = "Evento",
  PRESENCIA        = "Presencia",
  AUSENCIA         = "Ausencia/Vacaciones",
  TARIFARIO        = "Periodo tarifario",
  PERSONALIZADO    = "Personalizado",
}

export enum ContextStatus {
  PLANNED = "Planificado",
  ACTIVE  = "Activo",
  CLOSED  = "Cerrado",
}

export type ContextMetadata = {
  product?:   string;
  occupancy?: string;
  mode?:      string;
  tariff?:    string;
  notes?:     string;
};

export type OperatingContext = {
  id:           number;
  contextUUID:  string;
  type:         ContextType;
  name:         string;
  hierarchy:    string;
  startAt:      string;
  endAt?:       string;
  status:       ContextStatus;
  metadata:     ContextMetadata;
  ofCode?:      string;
  product?:     string;
  line?:        string;
  producedQty?: number;
};

function daysAgo(n: number, h = 0, m = 0): string {
  const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return d.toISOString();
}
function daysAhead(n: number, h = 23, m = 59): string {
  const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, m, 0, 0); return d.toISOString();
}

export const MOCK_CONTEXTS: OperatingContext[] = [
  { id: 1,  contextUUID: "CO-2026-001", type: ContextType.OF,               name: "OF-2026-0142",                       hierarchy: "Planta Norte > Área Producción > Moldeadora-M01", startAt: daysAgo(2, 6, 0),   status: ContextStatus.ACTIVE,   metadata: { product: "Carcasa XP-200" },               ofCode: "OF-2026-0142", product: "Carcasa XP-200", line: "Moldeadora-M01", producedQty: 1240 },
  { id: 2,  contextUUID: "CO-2026-002", type: ContextType.OF,               name: "OF-2026-0143",                       hierarchy: "Planta Norte > Área Producción > Moldeadora-M02", startAt: daysAgo(1, 14, 0),  status: ContextStatus.ACTIVE,   metadata: { product: "Tapa PE-100" },                  ofCode: "OF-2026-0143", product: "Tapa PE-100",    line: "Moldeadora-M02", producedQty: 580  },
  { id: 3,  contextUUID: "CO-2026-003", type: ContextType.TURNO,            name: "Turno Mañana — Semana 08",           hierarchy: "Planta Norte > Área Producción",                  startAt: daysAgo(0, 6, 0),   endAt: daysAhead(4, 14, 0), status: ContextStatus.ACTIVE,   metadata: { mode: "Producción" } },
  { id: 4,  contextUUID: "CO-2026-004", type: ContextType.HORARIO_LABORAL,  name: "Horario Laboral Feb 2026",           hierarchy: "Planta Norte",                                    startAt: daysAgo(17, 8, 0),  endAt: daysAhead(11, 17, 0), status: ContextStatus.ACTIVE,  metadata: { occupancy: "Alta" } },
  { id: 5,  contextUUID: "CO-2026-005", type: ContextType.PARADA,           name: "Parada Mantenimiento Preventivo",    hierarchy: "Planta Sur > Área Mantenimiento",                  startAt: daysAhead(5, 6, 0), endAt: daysAhead(6, 22, 0),  status: ContextStatus.PLANNED, metadata: { mode: "Mantenimiento", notes: "Revisión anual Moldeadoras" } },
  { id: 6,  contextUUID: "CO-2026-006", type: ContextType.TARIFARIO,        name: "Periodo Valle — Discriminación Horaria", hierarchy: "Planta Norte",                               startAt: daysAgo(0, 0, 0),   endAt: daysAhead(0, 7, 59),  status: ContextStatus.ACTIVE,  metadata: { tariff: "Valle" } },
  { id: 7,  contextUUID: "CO-2026-007", type: ContextType.HVAC,             name: "HVAC Zona Norte — Activo",           hierarchy: "Planta Norte > Área Utilities > Unidad-H01",      startAt: daysAgo(1, 8, 0),   status: ContextStatus.ACTIVE,   metadata: {} },
  { id: 8,  contextUUID: "CO-2026-008", type: ContextType.OF,               name: "OF-2026-0138",                       hierarchy: "Planta Norte > Área Producción > Moldeadora-M03", startAt: daysAgo(8, 6, 0),   endAt: daysAgo(5, 22, 0),    status: ContextStatus.CLOSED,  metadata: { product: "Marco AR-50" }, ofCode: "OF-2026-0138", product: "Marco AR-50", line: "Moldeadora-M03", producedQty: 3000 },
  { id: 9,  contextUUID: "CO-2026-009", type: ContextType.EVENTO,           name: "Reunión de Producción Semanal",      hierarchy: "Planta Norte",                                    startAt: daysAhead(2, 9, 0), endAt: daysAhead(2, 10, 30), status: ContextStatus.PLANNED, metadata: { occupancy: "10 personas" } },
  { id: 10, contextUUID: "CO-2026-010", type: ContextType.PERSONALIZADO,    name: "Prueba de Carga Eléctrica",          hierarchy: "Planta Sur > Área Utilities",                     startAt: daysAgo(3, 10, 0),  endAt: daysAgo(3, 16, 0),    status: ContextStatus.CLOSED,  metadata: { notes: "Validación nuevo transformador" } },
];
