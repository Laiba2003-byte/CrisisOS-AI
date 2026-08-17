import { useEffect, useRef } from "react";
import L from "leaflet";
import { severityStyles } from "../data/dashboardData.js";
import { getSeverityStyle, statusLabel } from "../utils/formatters.js";

const DEFAULT_CENTER = [
  Number(import.meta.env.VITE_MAP_DEFAULT_LAT || 31.5204),
  Number(import.meta.env.VITE_MAP_DEFAULT_LNG || 74.3587)
];
const DEFAULT_ZOOM = Number(import.meta.env.VITE_MAP_DEFAULT_ZOOM || 12);

function createMarkerHtml(color, inner = "") {
  return `<div class="map-marker" style="--marker-color:${color}"><span>${inner}</span></div>`;
}

function DashboardMap({ heightClass = "h-[390px]", incidents, resources, title = "Live Incident Map" }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: true,
      zoomControl: false
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      maxZoom: 19
    }).addTo(map);
    L.control.zoom({ position: "topleft" }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerRef.current) {
      return;
    }

    setTimeout(() => mapInstanceRef.current?.invalidateSize(), 0);
  }, [heightClass]);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerRef.current) {
      return;
    }

    layerRef.current.clearLayers();
    const markerBounds = [];

    incidents
      .filter((incident) => typeof incident.lat === "number" && typeof incident.lng === "number")
      .forEach((incident) => {
        const style = getSeverityStyle(incident.severity);
        const icon = L.divIcon({ className: "", html: createMarkerHtml(style.stroke), iconSize: [34, 34], iconAnchor: [17, 17] });
        markerBounds.push([incident.lat, incident.lng]);
        L.marker([incident.lat, incident.lng], { icon })
          .bindPopup(`<strong>${style.label}</strong><br />${incident.locationText || "Unknown location"}`)
          .addTo(layerRef.current);
      });

    resources
      .filter((resource) => typeof resource.lat === "number" && typeof resource.lng === "number")
      .slice(0, 36)
      .forEach((resource) => {
        const color = resource.status === "available" ? "#22c55e" : resource.status === "busy" ? "#f59e0b" : "#64748b";
        const icon = L.divIcon({ className: "", html: createMarkerHtml(color, "+"), iconSize: [28, 28], iconAnchor: [14, 14] });
        markerBounds.push([resource.lat, resource.lng]);
        L.marker([resource.lat, resource.lng], { icon })
          .bindPopup(`<strong>${resource.name}</strong><br />${statusLabel(resource.status)}`)
          .addTo(layerRef.current);
      });

    if (markerBounds.length > 1) {
      mapInstanceRef.current.fitBounds(markerBounds, { maxZoom: 12, padding: [30, 30] });
    }
  }, [incidents, resources]);

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#0b1725]">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-400" />Incidents</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" />Available</span>
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-400" />Busy</span>
        </div>
      </div>
      <div className={`relative border-t border-white/10 ${heightClass}`}>
        <div ref={mapRef} className="h-full w-full bg-[#07111d]" />
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-wrap justify-center gap-4 rounded-lg border border-white/10 bg-[#07111d]/85 px-4 py-2 text-xs text-slate-300 backdrop-blur">
          {Object.entries(severityStyles).map(([key, value]) => (
            <span key={key} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${value.dot}`} />
              {value.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DashboardMap;