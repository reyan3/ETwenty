import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";
import api from "../api/api";

const HeatmapMap = lazy(() => import("../components/HeatmapMap"));

// Risk colors mapped to modern hex palettes
const RISK_COLORS = {
  LOW: "#10B981",     // Emerald
  MEDIUM: "#F59E0B",  // Amber
  HIGH: "#F97316",    // Orange
  CRITICAL: "#EF4444",// Red
};

const HeatmapView = () => {
  const [heatPoints, setHeatPoints] = useState([]);
  const { showToast } = useToast();
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [shouldLoadMap, setShouldLoadMap] = useState(
    () =>
      typeof window === "undefined" ||
      !("IntersectionObserver" in window)
  );
  const mapContainerRef = useRef(null);

  // Toggle state: 'markers' (Clustered pins) or 'heatmap' (Thermal density)
  const [viewMode, setViewMode] = useState("markers");

  useEffect(() => {
    if (loading || shouldLoadMap) return;

    const mapContainer = mapContainerRef.current;
    if (!mapContainer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(mapContainer);
    return () => observer.disconnect();
  }, [loading, shouldLoadMap]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [heatRes, stationRes] = await Promise.all([
          api.get("/reports/heatmap"),
          api.get("/reports/station-risk"),
        ]);

        setHeatPoints(
          (heatRes.data || [])
            .filter((p) => p.lat && p.lng)
            .map((p) => [p.lat, p.lng, p.weight || 0.8])
        );

        setStations(stationRes.data || []);
      } catch (err) {
        showToast("No data is fetched, fetch failed!", "error");
        console.error("Error loading map data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtered stations for sidebar list
  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      const name = String(s.stationName ?? "");
      const risk = String(s.riskLevel ?? "").toUpperCase();

      const matchesRisk =
        activeFilter === "ALL" || risk === activeFilter.toUpperCase();

      const query = searchTerm.trim().toLowerCase();
      const matchesSearch = query === "" || name.toLowerCase().includes(query);

      return matchesRisk && matchesSearch;
    });
  }, [stations, activeFilter, searchTerm]);

  // Skeleton Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 pt-20 sm:py-20 lg:p-25 space-y-6 animate-pulse">
        <div className="h-8 w-72 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-162">
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="h-6 w-1/2 bg-slate-800 rounded" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pt-20 sm:py-20 lg:p-25 space-y-6 font-sans">
      {/* Dynamic Keyframes & Cluster Custom Styling */}
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          backdrop-filter: blur(12px);
          color: #f8fafc !important;
          border: 1px solid rgba(51, 65, 85, 0.8);
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
        }
        .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
          background-color: rgba(30, 41, 59, 0.8) !important;
        }
        .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
          background-color: rgba(79, 70, 229, 0.85) !important;
          color: #ffffff !important;
          font-weight: bold;
          border-radius: 50%;
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white bg-clip-text bg-linear-to-r from-white via-slate-200 to-indigo-300">
            Geospatial Complaint & Risk Heatmap
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time thermal intensity mapping and clustered station analytics.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 w-fit">
          <span className="font-semibold text-slate-400">Risk:</span>
          {Object.entries(RISK_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{level.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Map + Side Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-175">
        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl h-125 lg:h-full"
        >
          {shouldLoadMap ? (
            <Suspense
              fallback={
                <div
                  role="status"
                  className="flex h-full items-center justify-center bg-slate-900 text-sm text-slate-400"
                >
                  Loading map…
                </div>
              }
            >
              <HeatmapMap
                heatPoints={heatPoints}
                stations={stations}
                selectedStation={selectedStation}
                setSelectedStation={setSelectedStation}
                viewMode={viewMode}
                setViewMode={setViewMode}
                riskColors={RISK_COLORS}
              />
            </Suspense>
          ) : (
            <div aria-hidden="true" className="h-full bg-slate-900" />
          )}
        </div>

        {/* Side Analytics Panel */}
        <div className="flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md h-125 lg:h-full overflow-hidden">
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-200">
                Risky Stations
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {filteredStations.length} listed
              </span>
            </div>

            <input
              type="text"
              placeholder="Search station name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
                <button
                  key={level}
                  onClick={() => setActiveFilter(level)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                    activeFilter === level
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1 custom-scrollbar">
            {filteredStations.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-500 text-xs">
                <p>No stations matching criteria.</p>
              </div>
            ) : (
              filteredStations.map((station) => {
                const isSelected =
                  selectedStation?.stationId === station.stationId;
                return (
                  <div
                    key={station.stationId}
                    onClick={() => {
                      setViewMode("markers"); // Auto-switch to pins view if user clicks a sidebar station
                      setSelectedStation(station);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg"
                        : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-200 text-xs">
                          {station.stationName}
                        </h4>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                        style={{
                          backgroundColor:
                            RISK_COLORS[station.riskLevel] || "#3B82F6",
                        }}
                      >
                        {station.riskLevel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                      <span>
                        Reports:{" "}
                        <b className="text-slate-200">{station.reportCount}</b>
                      </span>
                      <span>
                        Score:{" "}
                        <b className="text-indigo-400">{station.riskScore}</b>
                      </span>
                      <span>
                        Avg Cost:{" "}
                        <b className="text-emerald-400">
                          ₹{station.avgRepairCost}
                        </b>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapView;