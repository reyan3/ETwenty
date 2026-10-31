import { useEffect, useState, useCallback } from "react";
import { State } from "country-state-city";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  Car,
  Truck,
  MapPin,
  AlertTriangle,
  Gauge,
  IndianRupee,
  RotateCcw,
  FileSpreadsheet,
} from "lucide-react";
import api from "../api/api";
import REPORT_ISSUE_TYPES from "../constants/reportIssueTypes";

const COUNTRY_CODE = "IN";
const REPORTS_PER_PAGE = 9;
const INDIAN_STATES = State.getStatesOfCountry(COUNTRY_CODE);

const VEHICLE_TYPES = [
  { value: "car", label: "Car" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "scooter", label: "Scooter" },
  { value: "commercial", label: "Commercial Vehicle" },
];

const BrowseReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    state: "",
    issueType: "",
    vehicleType: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  const fetchReports = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/reports", {
        params: {
          search,
          ...filters,
          page,
          limit: REPORTS_PER_PAGE,
        },
        signal,
      });

      if (!Array.isArray(res.data?.reports)) {
        throw new Error("Unexpected reports response");
      }

      const nextReports = res.data.reports;
      const pagination = res.data.pagination || {};
      setReports(nextReports);
      setTotalPages(Number(pagination.totalPages) || 1);
      setTotalReports(Number(pagination.total ?? nextReports.length));
    } catch (err) {
      if (signal.aborted) return;
      console.error("Failed to fetch reports:", err);
      setError("Failed to load reports. Please try again.");
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [search, filters, page]);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    const timer = setTimeout(() => {
      fetchReports(controller.signal);
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetchReports]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setFilters({ state: "", issueType: "", vehicleType: "" });
    setPage(1);
  };

  const getIssueBadgeStyle = (issueType) => {
    switch (issueType) {
      case "engine_wear":
      case "engine_knocking":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "carburettor_clog":
      case "fuel_system_damage":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "starting_issue":
      case "fuel_leakage":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "poor_acceleration":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "rough_idling":
        return "bg-violet-500/10 text-violet-400 border-violet-500/20";
      case "mileage_drop":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const formatReportDate = (value) => {
    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getVehicleIcon = (vehicleType) => {
    const normalizedType = String(vehicleType || "").toLowerCase();
    if (normalizedType === "car") return Car;
    if (normalizedType === "truck" || normalizedType === "commercial") return Truck;
    return Car;
  };

  return (
    <div className="relative min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-200 font-sans">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Verified E20 Fuel Incident Reports.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Admin-verified real-world reports and vehicle failure data collected across India
            </p>
          </div>
          <div className="text-xs text-slate-400 font-semibold bg-slate-900/80 px-4 py-2 rounded-xl border border-white/10 self-start md:self-auto">
            Verified Records: <span className="text-emerald-400">{totalReports}</span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 space-y-4 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search description, city..."
                value={search}
                onChange={handleSearchChange}
                className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>

            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                name="state"
                value={filters.state}
                onChange={handleFilterChange}
                className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">All States</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s.isoCode} value={s.name} className="bg-slate-900">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <AlertTriangle className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                name="issueType"
                value={filters.issueType}
                onChange={handleFilterChange}
                className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">All Issue Types</option>
                {REPORT_ISSUE_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-900">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Car className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                name="vehicleType"
                value={filters.vehicleType}
                onChange={handleFilterChange}
                className="w-full bg-slate-950/80 border border-white/10 focus:border-emerald-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">All Vehicles</option>
                {VEHICLE_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-900">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(search || filters.state || filters.issueType || filters.vehicleType) && (
            <div className="flex justify-end">
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 rounded-3xl bg-slate-900/40 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center rounded-3xl bg-red-500/10 border border-red-500/20 space-y-3">
            <h3 className="text-base font-bold text-red-300">Error Loading Reports</h3>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/30 border border-white/5 space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">No Verified Reports Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no verified reports matching your criteria at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports.map((r) => (
              <div
                key={r._id}
                className="group p-6 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between shadow-lg"
              >
                <div className="space-y-3">
                  <div className=" gap-2 gap-y-3 grid lg:grid-cols-2 grid-cols-1">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getIssueBadgeStyle(r.issueType)}`}>
                      {r.issueType?.replace(/_/g, " ")}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center justify-between gap-2">
                      Verified<Star className="w-3 h-3 "/>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                      {(() => {
                        const VehicleIcon = getVehicleIcon(r.vehicleType);
                        return <VehicleIcon className="w-3.5 h-3.5 text-emerald-400" />;
                      })()}
                      {r.vehicleType} {r.vehicleYear}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed pt-1">
                    {r.description || "No description provided."}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-medium uppercase tracking-wider text-slate-500">Verified On</span>
                    <span className="font-semibold text-slate-300">
                      {formatReportDate(r.createdAt || r.created_at || r.created)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                      <Gauge className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[9px] block font-semibold text-slate-500 uppercase">Drop</span>
                        <span className="font-bold text-white">
                          {r.mileageDropPercent != null ? `${r.mileageDropPercent}%` : "N/A"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[9px] block font-semibold text-slate-500 uppercase">Cost</span>
                        <span className="font-bold text-white">
                          {r.repairCost != null ? `₹${Number(r.repairCost).toLocaleString("en-IN")}` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {r.district ? `${r.district}, ` : ""}
                      {r.state || "Unknown Location"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 hover:border-emerald-400/40 text-xs font-semibold text-slate-300 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="text-xs font-semibold text-slate-400">
              Page <span className="text-white font-bold">{page}</span> of{" "}
              <span className="text-white font-bold">{totalPages}</span>
            </div>

            <button
              disabled={page === totalPages || loading}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 hover:border-emerald-400/40 text-xs font-semibold text-slate-300 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseReports;