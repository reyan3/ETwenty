import { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useConfirm } from "../context/ConfirmContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  FileCheck, 
  Clock,
  AlertCircle, 
  FileText, 
  Trash2, 
  AlertTriangle 
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [profileData, setProfileData] = useState({
    reports: [],
    stats: { totalReports: 0, verifiedReports: 0, pendingReports: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const response = await api.get("/user/profile");
      setProfileData(response.data);
    } catch (err) {
      showToast("Failed to load profile details", "error");
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user, fetchProfileData]);

  const handleDeleteAccount = async () => {
    const isConfirmed = await confirm({
      title: "Delete Account Permanently",
      message: "Are you sure you want to delete your account? All your submitted fuel incident reports and account data will be permanently removed.",
      confirmText: "Delete My Account",
      cancelText: "Keep Account",
      variant: "danger",
    });

    if (!isConfirmed) return;

    setDeleting(true);
    try {
      await api.delete("/user/account");
      showToast("Your account has been deleted", "success");
      await signOut(auth);
      navigate("/");
    } catch (err) {
      showToast("Failed to delete account. Please try again.", "error");
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="relative min-h-screen pt-28 pb-12 flex items-center justify-center px-4 overflow-hidden bg-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 p-8 rounded-3xl bg-slate-900/65 backdrop-blur-2xl border border-emerald-500/20 text-center max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-400 leading-relaxed">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-200 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* User Profile Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 overflow-hidden">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" onError={(e) => {
                    e.currentTarget.src = "/octo.png";
                  }} />
            ) : (
              <UserIcon className="w-10 h-10" />
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {user.displayName || "User Profile"}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-500" />
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                Joined: {new Date(user.metadata?.creationTime || Date.now()).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid Skeleton / Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-slate-800 rounded-md" />
                  <div className="h-4 w-4 bg-slate-800 rounded-md" />
                </div>
                <div className="h-8 w-16 bg-slate-800 rounded-md" />
              </div>
            ))}
          </div>
        ) : !fetchError ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Submitted Reports</span>
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">{profileData.stats.totalReports}</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Verified Receipts</span>
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">{profileData.stats.verifiedReports}</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-medium">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400">{profileData.stats.pendingReports}</p>
            </div>
          </div>
        ) : null}

        {fetchError ? (
          <div
            role="alert"
            className="p-8 text-center rounded-2xl bg-red-500/5 border border-red-500/20"
          >
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-white">
              Unable to Load Profile
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Your report statistics and submissions could not be loaded.
            </p>
            <button
              type="button"
              onClick={fetchProfileData}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Your Submissions
            </h2>

            {loading ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 animate-pulse flex items-center justify-between gap-4"
                  >
                    <div className="space-y-2.5 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-32 bg-slate-800 rounded-md" />
                        <div className="h-4 w-20 bg-slate-800 rounded-full" />
                      </div>
                      <div className="h-3 w-3/4 bg-slate-800 rounded-md" />
                    </div>
                    <div className="h-3 w-16 bg-slate-800 rounded-md shrink-0" />
                  </div>
                ))}
              </div>
            ) : profileData.reports.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/30 border border-white/5 text-slate-500 text-xs">
                You haven't submitted any fuel incident reports yet.
              </div>
            ) : (
              <div className="grid gap-3">
                {profileData.reports.map((report) => (
                  <div
                    key={report._id}
                    className="p-4 rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 flex items-center justify-between gap-4 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {report.petrolStation?.name || "Petrol Station"}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-full font-semibold border ${
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

                      <p className="text-xs text-slate-400 truncate max-w-md">
                        {report.description || "No description provided"}
                      </p>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(report.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Danger Zone: Delete Account */}
        <div className="pt-6 border-t border-red-500/20">
          <div className="p-6 rounded-3xl bg-red-950/20 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Delete Account
              </h3>
              <p className="text-xs text-red-300/70">
                Permanently delete your profile and all submitted incident reports.
              </p>
            </div>

            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-red-950/50 transition cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}