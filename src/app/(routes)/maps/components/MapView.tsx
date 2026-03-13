"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type GeoMarker = {
  id: string;
  name: string;
  type: "planta" | "area" | "seccion";
  lat: number;
  lng: number;
  plantName?: string;
  description?: string;
  sectionCount?: number;
  areaCount?: number;
};

type MapViewProps = {
  markers: GeoMarker[];
  focusId?: string | null;
  onMarkerClick?: (id: string) => void;
};

const ICON_CONFIG: Record<"planta" | "area" | "seccion", { bg: string; size: number; svg: string }> = {
  planta: {
    bg: "#0284c7",
    size: 36,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  },
  area: {
    bg: "#059669",
    size: 30,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  },
  seccion: {
    bg: "#d97706",
    size: 26,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  },
};

const TYPE_LABEL: Record<"planta" | "area" | "seccion", string> = {
  planta: "Planta",
  area: "Área",
  seccion: "Sección",
};

function buildDivIcon(type: "planta" | "area" | "seccion") {
  const { bg, size, svg } = ICON_CONFIG[type];
  const half = size / 2;
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      border:2.5px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.22);
      cursor:pointer;
    ">${svg}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -(half + 4)],
  });
}

const ZOOM_BY_TYPE: Record<"planta" | "area" | "seccion", number> = {
  planta: 14,
  area: 16,
  seccion: 17,
};

export function MapView({ markers, focusId, onMarkerClick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [40.4168, -3.7038],
      zoom: 6,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();
    markersMapRef.current.clear();

    markers.forEach((m) => {
      const icon = buildDivIcon(m.type);
      const marker = L.marker([m.lat, m.lng], { icon });

      const extras = [
        m.plantName ? `<div style="font-size:12px;color:#64748b;margin-bottom:5px;">${m.plantName}</div>` : "",
        m.description ? `<div style="font-size:12px;color:#475569;margin-bottom:5px;">${m.description}</div>` : "",
        m.areaCount != null ? `<div style="font-size:11px;color:#94a3b8;">${m.areaCount} áreas</div>` : "",
        m.sectionCount != null ? `<div style="font-size:11px;color:#94a3b8;">${m.sectionCount} secciones</div>` : "",
      ].join("");

      marker.bindPopup(`
        <div style="font-family:system-ui,sans-serif;min-width:180px;padding:2px 0;">
          <div style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px;">
            ${TYPE_LABEL[m.type]}
          </div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:2px;">${m.name}</div>
          ${extras}
          <div style="font-size:10px;color:#cbd5e1;margin-top:6px;font-family:monospace;">${m.lat.toFixed(6)}, ${m.lng.toFixed(6)}</div>
        </div>
      `, { maxWidth: 240 });

      if (onMarkerClick) marker.on("click", () => onMarkerClick(m.id));
      marker.addTo(markerLayerRef.current!);
      markersMapRef.current.set(m.id, marker);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  useEffect(() => {
    if (!mapRef.current || !focusId) return;
    const target = markers.find((m) => m.id === focusId);
    if (!target) return;

    mapRef.current.flyTo([target.lat, target.lng], ZOOM_BY_TYPE[target.type], { duration: 0.8 });
    setTimeout(() => markersMapRef.current.get(focusId)?.openPopup(), 900);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
