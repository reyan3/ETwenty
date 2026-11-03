import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet.heat";

const MapController = ({ selectedStation }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedStation?.lat && selectedStation?.lng) {
      map.flyTo([selectedStation.lat, selectedStation.lng], 13, {
        duration: 1.5,
      });
    }
  }, [selectedStation, map]);
  return null;
};

const HeatLayer = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!points || !points.length) return;

    const maxWeight = points.reduce(
      (max, point) => Math.max(max, Number(point[2]) || 0),
      1
    );

    const heatLayer = L.heatLayer(points, {
      radius: 28,
      blur: 18,
      maxZoom: 12,
      max: maxWeight,
      gradient: { 0.2: "#3B82F6", 0.5: "#F59E0B", 0.8: "#EF4444" },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [points, map]);

  return null;
};

const createRiskIcon = (level, riskColors) => {
  const color = riskColors[level] || "#3B82F6";
  return L.divIcon({
    className: "custom-risk-marker",
    html: `
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 12px ${color};
      ">
        ${
          level === "CRITICAL" || level === "HIGH"
            ? `<div style="
                position: absolute;
                inset: -4px;
                border-radius: 50%;
                background: ${color};
                opacity: 0.5;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>`
            : ""
        }
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const HeatmapMap = ({
  heatPoints,
  stations,
  selectedStation,
  setSelectedStation,
  viewMode,
  setViewMode,
  riskColors,
}) => (
  <>
    <div className="absolute top-4 right-4 z-999 bg-slate-900/95 border border-slate-700/80 backdrop-blur-md shadow-xl rounded-xl p-1 flex gap-1">
      <button
        onClick={() => setViewMode("markers")}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
          viewMode === "markers"
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        }`}
      >
        Station Pins
      </button>
      <button
        onClick={() => setViewMode("heatmap")}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
          viewMode === "heatmap"
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
        }`}
      >
        Risk Heatmap
      </button>
    </div>

    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      scrollWheelZoom={true}
      style={{
        height: "100%",
        width: "100%",
        background: "#0B0F19",
        zIndex: "100",
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <MapController selectedStation={selectedStation} />

      {viewMode === "heatmap" ? (
        <HeatLayer points={heatPoints} />
      ) : (
        <MarkerClusterGroup chunkedLoading>
          {stations
            .filter((station) => station.lat && station.lng)
            .map((station) => (
              <Marker
                key={station.stationId}
                position={[station.lat, station.lng]}
                icon={createRiskIcon(station.riskLevel, riskColors)}
                eventHandlers={{
                  click: () => setSelectedStation(station),
                }}
              >
                <Popup>
                  <div className="p-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
                      <h4 className="font-bold text-slate-100 text-sm truncate">
                        {station.stationName}
                      </h4>
                      <span
                        className="p-2 rounded text-[10px] font-bold text-white uppercase"
                        style={{
                          backgroundColor:
                            riskColors[station.riskLevel] || "#3B82F6",
                        }}
                      >
                        {station.riskLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Reports
                        </span>
                        <span className="font-semibold text-white">
                          {station.reportCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Risk Score
                        </span>
                        <span className="font-semibold text-indigo-400">
                          {station.riskScore} / 100
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Mileage Drop
                        </span>
                        <span className="font-semibold text-amber-400">
                          {station.avgMileageDrop}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          Avg Repair
                        </span>
                        <span className="font-semibold text-emerald-400">
                          ₹{station.avgRepairCost}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-indigo-600/30 hover:bg-black text-indigo-100 border border-indigo-500/30 py-1 rounded text-[11px] font-medium transition p-2"
                      >
                        View Map
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-emerald-600/30 hover:bg-black text-emerald-100 border border-emerald-500/30 py-1 rounded text-[11px] font-medium transition p-2"
                      >
                        Directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MarkerClusterGroup>
      )}
    </MapContainer>
  </>
);

export default HeatmapMap;
