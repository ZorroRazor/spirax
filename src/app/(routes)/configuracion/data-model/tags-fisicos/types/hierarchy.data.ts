export type HierarchyTree = {
  [planta: string]: {
    [area: string]: {
      [seccion: string]: string[];
    };
  };
};

export const HIERARCHY_DATA: HierarchyTree = {
  "Planta Norte": {
    "Área Producción": {
      "Sección Moldeado": ["Moldeadora-M01", "Moldeadora-M02", "Moldeadora-M03"],
      "Sección Acabado": ["Cabina-A01", "Cabina-A02"],
      "Sección Ensamblado": ["Mesa-E01", "Mesa-E02"],
    },
    "Área Utilities": {
      "Sección HVAC": ["Unidad-H01", "Unidad-H02"],
      "Sección Eléctrica": ["Cuadro-QE01", "Cuadro-QE02"],
    },
    "Área Almacén": {
      "Sección Entrada": ["Báscula-BE01"],
      "Sección Salida": ["Báscula-BS01"],
    },
  },
  "Planta Sur": {
    "Área Logística": {
      "Sección Recepción": ["Dock-R01", "Dock-R02"],
      "Sección Expedición": ["Dock-E01", "Dock-E02"],
    },
    "Área Mantenimiento": {
      "Sección Taller": ["Banco-T01", "Banco-T02"],
      "Sección Repuestos": ["Rack-RP01"],
    },
  },
};
