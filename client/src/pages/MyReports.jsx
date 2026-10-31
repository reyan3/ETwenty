import { useEffect, useState } from "react";
import api from "../api/api";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import REPORT_ISSUE_TYPES from "../constants/reportIssueTypes";
import { 
  Search, 
  MapPin, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  ExternalLink, 
  AlertCircle,
  Gauge,
  IndianRupee,
  Car,
  Truck,
  Motorbike,
  FileText,
  Activity,
  Sparkles,
  Loader2,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

const MyReports = () => {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { user, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);
    const [fetchError, setFetchError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);

  // State for viewing receipt image in a modal
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState(null);

  // Fetch Reports
  const fetchMyReports = async () => {
    try {
      setLoading(true);
      setFetchError(null)
      const res = await api.get("/reports/mine");
      setReports(res.data);
    } catch (err) {
      setFetchError("Failed to load your reports. Please try again.");
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyReports();
  }, [user]);

  // Client-side filter
  const filteredReports = reports.filter((r) => {
    const term = search.toLowerCase();
    return (
      r.description?.toLowerCase().includes(term) ||
      r.state?.toLowerCase().includes(term) ||
      r.district?.toLowerCase().includes(term) ||
      r.issueType?.toLowerCase().includes(term) ||
      r.vehicleType?.toLowerCase().includes(term)
    );
  });

  // Delete Report
  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Delete Report",
      message:
        "Are you sure you want to permanently delete this report? This action cannot be undone.",
      confirmText: "Delete Report",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r._id !== id));
      showToast("Deleted Successfully", "success");
    } catch (err) {
      showToast("Delete failed", "error");
      console.error(err);
    }
  };

  // Edit function
  const startEdit = (report) => {
    setEditingId(report._id);
    setEditForm({
      issueType: report.issueType,
      mileageDropPercent: report.mileageDropPercent,
      description: report.description,
      repairCost: report.repairCost,
    });
  };

  // Change function
  const handleEditChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

  // Update Report
  const handleUpdate = async (id) => {
    try {
      const res = await api.put(`/reports/${id}`, editForm);
      setReports((prev) => prev.map((r) => (r._id === id ? res.data : r)));
      setEditingId(null);
      showToast("Updated Successfully", "success");
    } catch (err) {
      showToast("Update Failed", "error");
      console.error(err);
    }
  };

  const formatIssueName = (type) => {
    if (!type) return "Issue Report";
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
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
    if (normalizedType === "motorcycle" || normalizedType === "motorbike" || normalizedType === "scooter") return Motorbike;
    return Car;
  };

  if (authLoading) {
    return (
      <div aria-busy="true" className="min-h-screen pt-28 pb-12 flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="sr-only">Checking sign-in status...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen pt-28 pb-12 flex items-center justify-center px-4 overflow-hidden bg-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 p-8 rounded-3xl bg-slate-900/65 backdrop-blur-2xl border border-emerald-500/20 text-center max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-400 leading-relaxed">Please sign in to access your reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-950 overflow-hidden text-slate-200">
      
      {/* Background Mesh & Glow Effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-10 left-1/4 w-125 h-125 bg-emerald-500/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-10 w-100 h-100 bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(circle, #34d399 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>User Logs</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FileText className="w-9 h-9 text-emerald-400" />
              My Diagnostics
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">
              Real time management portal for your logged vehicle ethanol reports, repair costs, and uploaded receipt proofs.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/70 z-10" />
            <input
              type="text"
              placeholder="Filter reports by issue, state, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-emerald-500/20 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)]"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-3xl bg-slate-900/40 backdrop-blur-md animate-pulse border border-emerald-500/10" />
            ))}
          </div>
        ) : fetchError ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 max-w-lg mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Unable to Load Reports</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {fetchError}
            </p>
            <button
              type="button"
              onClick={fetchMyReports}
              className="mt-5 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 backdrop-blur-xl border border-white/10 max-w-lg mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">No Reports Found</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {search ? "No reports match your current filter query." : "You haven't registered any vehicle diagnostic reports yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((r) => {
              const isEditing = editingId === r._id;
              const isVerified = r.verificationStatus === "Verified Receipt";
              const isVerificationFailed = ["Verification Failed"].includes(r.verificationStatus);
              

              return (
                <div
                  key={r._id}
                  className="group relative rounded-3xl bg-slate-900/65 backdrop-blur-xl border border-white/10 p-6 flex flex-col justify-between hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300"
                >
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors pointer-events-none" />

                  {isEditing ? (
                    <div className="space-y-4 relative z-10">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5" />
                          Modifying Report
                        </span>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] text-slate-400 uppercase font-semibold mb-1 block">Issue Type</label>
                          <select
                            name="issueType"
                            value={editForm.issueType}
                            onChange={handleEditChange}
                            className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                          >
                            {REPORT_ISSUE_TYPES.map(({ value, label }) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-400 uppercase font-semibold mb-1 block">Mileage Drop (%)</label>
                            <input
                              name="mileageDropPercent"
                              type="number"
                              value={editForm.mileageDropPercent}
                              onChange={handleEditChange}
                              className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400 uppercase font-semibold mb-1 block">Repair Cost (₹)</label>
                            <input
                              name="repairCost"
                              type="number"
                              value={editForm.repairCost}
                              onChange={handleEditChange}
                              className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-400 uppercase font-semibold mb-1 block">Description</label>
                          <textarea
                            name="description"
                            rows="3"
                            value={editForm.description}
                            onChange={handleEditChange}
                            className="w-full bg-slate-950 border border-emerald-500/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleUpdate(r._id)}
                          className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 flex-1 flex flex-col justify-between relative z-10">
                      <div>
                        {/* Top Badge & Vehicle Info */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-400 text-xs font-bold tracking-wide shadow-[0_0_10px_rgba(52,211,153,0.15)]">
                            {formatIssueName(r.issueType)}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                            {(() => {
                              const VehicleIcon = getVehicleIcon(r.vehicleType);
                              return <VehicleIcon className="w-3.5 h-3.5 text-emerald-400" />;
                            })()}
                            <span>{r.vehicleType}</span>
                            {r.vehicleYear && <span className="text-slate-500">{r.vehicleYear}</span>}
                          </div>
                        </div>

                        {/* Verification Status Badge */}
                        <div className="mb-3 flex items-center gap-1.5">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Receipt
                            </span>
                          ) : isVerificationFailed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                              <XCircle className="w-3.5 h-3.5" /> {r.verificationStatus}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5" /> {r.verificationStatus === "Pending Review" ? "Pending Review" : r.verificationStatus}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-4">
                          {r.description || "No diagnostic remarks provided."}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-4">
                          <div>
                            <span className="font-semibold uppercase tracking-wider text-slate-500">Created: </span>
                            <span className="font-medium text-slate-300">{formatReportDate(r.createdAt)}</span>
                          </div>
                          
                          {/* Receipt Image Quick Preview Trigger */}
                          {r.evidenceImage?.url && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptUrl(r.evidenceImage.url)}
                              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>View Receipt</span>
                            </button>
                          )}
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                              <Gauge className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Drop</p>
                              <p className="text-sm font-black text-white">{r.mileageDropPercent || 0}%</p>
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                              <IndianRupee className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Repair</p>
                              <p className="text-sm font-black text-white">
                                ₹ {r.repairCost != null ? Number(r.repairCost).toLocaleString("en-IN") : 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions & Map Tag */}
                      <div className="pt-3 border-t border-white/10 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-1.5 truncate max-w-47">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{r.district ? `${r.district}, ${r.state}` : r.state}</span>
                          </div>

                          {r.location?.coordinates && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${r.location.coordinates[1]},${r.location.coordinates[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors shrink-0 font-semibold"
                            >
                              <span>Map</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => startEdit(r)}
                            className="flex-1 py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-emerald-500 hover:text-slate-950 border border-white/10 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all duration-200 group-hover:border-emerald-400/50 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Report</span>
                          </button>

                          <button
                            onClick={() => handleDelete(r._id)}
                            className="py-2.5 px-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-xs font-bold text-rose-400 flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Receipt Preview Modal */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative max-w-lg w-full bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Uploaded Receipt Proof</span>
              </h3>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center max-h-[60vh]">
              <img
                src={selectedReceiptUrl}
                alt="Receipt Proof"
                className="w-full object-contain max-h-[60vh]"
              />
            </div>
            <button
              onClick={() => setSelectedReceiptUrl(null)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyReports;