import { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { useConfirm } from "../context/ConfirmContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import {
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  FileText,
} from "lucide-react";

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  
  

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const limit = 10; // Number of items per page

  const { user, loading: authLoading } = useAuth();

  const fetchReports = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(
          `/admin/reports?page=${page}&limit=${limit}`,
        );

        const userCNT = await api.get(`/admin/users/count`)

        if(userCNT.data){
          setTotalUsers(userCNT.data.totalUsers || 0); // 👈 Set total users
        } else{
          setTotalUsers(0)
        }
        

        // Handle response structure from paginated backend endpoint
        if (response.data && response.data.reports) {
          setReports(response.data.reports);
          setCurrentPage(response.data.currentPage || page);
          setTotalPages(response.data.totalPages || 1);
          setTotalReports(response.data.totalReports || 0);
        } else if (Array.isArray(response.data)) {
          // Fallback if backend returns a plain array
          setReports(response.data);
          setTotalReports(response.data.length);
          setTotalPages(1);
        }
        setLoading(false);
      } catch (err) {
        setError(
          "Failed to fetch reports. Ensure you have administrative privileges and a stable connection.",
        );
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError(
        "Authentication required. Please sign in to access the admin moderation dashboard.",
      );
      setLoading(false);
      return;
    }

    fetchReports(currentPage);
  }, [authLoading, fetchReports, user, currentPage]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.patch(`/admin/reports/${id}/status`, {
        verificationStatus: newStatus,
      });
      showToast(`Report status updated to ${newStatus}`, "success");
      fetchReports(currentPage); // Refresh current page after update
    } catch (err) {
      showToast("Failed to update status!", "error");
      console.error(err);
    }
  };

  const handleDeleteReport = async (id) => {
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
      await api.delete(`/admin/reports/${id}`);
      showToast("Report deleted successfully", "success");
      fetchReports(currentPage); // Refresh current page
    } catch (err) {
      showToast("Delete failed!", "error");
      console.error(err);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-white min-h-screen pt-24 pb-16">
      {/* Header & Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-8 h-8 text-emerald-400" />
            Admin Moderation Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review, verify, or manage user submitted fuel incident reports and
            receipts.
          </p>
        </div>

        {/* Total Users Badge */}
        <span className="bg-blue-950/60 text-blue-300 border border-blue-700/50 text-xs px-3.5 py-2 rounded-xl font-semibold shadow-sm flex items-center self-start sm:self-auto">
          Total Users: {totalUsers}
        </span>

        <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 text-xs px-3.5 py-2 rounded-xl font-semibold self-start sm:self-auto shadow-sm">
          Total Reports: {totalReports}
        </span>
      </div>

      {/* Professional Error State */}
      {error ? (
        <div className="my-12 p-8 rounded-3xl bg-red-950/20 border border-red-500/20 text-center max-w-xl mx-auto space-y-4 backdrop-blur-xl shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-red-200">
              Access or Connection Error
            </h3>
            <p className="text-xs text-red-300/80 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => fetchReports(currentPage)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold text-red-200 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      ) : loading && reports.length === 0 ? (
        /* Skeleton Loading Grid */
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl animate-pulse flex flex-col md:flex-row gap-6 items-start md:items-center justify-between"
            >
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-40 bg-slate-800 rounded-md" />
                  <div className="h-5 w-24 bg-slate-800 rounded-full" />
                </div>
                <div className="h-6 w-60 bg-slate-800 rounded-md" />
                <div className="h-4 w-32 bg-slate-800 rounded-md" />
              </div>
              <div className="w-24 h-24 rounded-lg bg-slate-800 shrink-0" />
              <div className="flex md:flex-col gap-2 w-full md:w-32">
                <div className="h-9 bg-slate-800 rounded-lg w-full" />
                <div className="h-9 bg-slate-800 rounded-lg w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        /* Empty State */
        <div className="my-16 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-12 text-center space-y-3 max-w-lg mx-auto backdrop-blur-xl">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">
            No Reports Found
          </h3>
          <p className="text-xs text-slate-500">
            There are currently no user-submitted reports pending review or
            stored in the database.
          </p>
        </div>
      ) : (
        /* Reports List */
        <div className="grid gap-4">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 hover:border-slate-700/80 p-5 rounded-2xl shadow-lg flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-all"
            >
              {/* Report Metadata */}
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium">
                    User:{" "}
                    <span className="text-slate-200">
                      {report.user?.email || "Unknown User"}
                    </span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-[11px] rounded-full font-semibold border ${
                      report.verificationStatus === "Verified Receipt"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : report.verificationStatus === "Verification Failed"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {report.verificationStatus}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">
                  Station: {report.petrolStation?.name || "Unspecified Station"}
                </h3>

                <p className="text-xs text-slate-300">
                  Amount:{" "}
                  <span className="font-semibold text-emerald-400">
                    ₹{report.ocrExtractedData?.totalAmount || "N/A"}
                  </span>
                </p>

                <p className="text-xs text-slate-300">
                  Repairing Amount:{" "}
                  <span className="font-semibold text-emerald-400">
                    ₹{report?.repairCost || "N/A"}
                  </span>
                </p>

                <p className="text-[11px] text-slate-500">
                  Submitted:{" "}
                  {new Date(report.createdAt).toLocaleString("en-IN")}
                </p>
              </div>

              {/* Receipt Preview Thumbnail */}
              {report.evidenceImage?.url && (
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 shadow-inner group">
                  <img
                    src={report.evidenceImage.url}
                    alt="Receipt Thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                    onClick={() =>
                      window.open(report.evidenceImage.url, "_blank")
                    }
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex md:flex-col gap-2 w-full md:w-36">
                <button
                  onClick={() =>
                    handleStatusUpdate(report._id, "Verified Receipt")
                  }
                  className="flex-1 md:flex-none bg-emerald-600/90 hover:bg-emerald-500 cursor-pointer px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    handleStatusUpdate(report._id, "Verification Failed")
                  }
                  className="flex-1 md:flex-none bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 cursor-pointer text-amber-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleDeleteReport(report._id)}
                  className="flex-1 md:flex-none bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 cursor-pointer text-red-400 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && !error && (
        <div className="flex justify-between items-center mt-8 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-4 rounded-2xl">
          <button
            disabled={currentPage === 1 || loading}
            onClick={() => handlePageChange(currentPage - 1)}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Page <span className="text-white font-bold">{currentPage}</span> of{" "}
            <span className="text-white font-bold">{totalPages}</span>
          </span>

          <button
            disabled={currentPage === totalPages || loading}
            onClick={() => handlePageChange(currentPage + 1)}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
