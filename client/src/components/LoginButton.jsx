import { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import { LogOut, User as UserIcon } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

const LoginButton = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Sync user with backend
      await api.post("/auth/sync", {
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      });
    } catch (err) {
      showToast("Auth Failed!", "error");
      console.error("Sync or Auth failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      navigate("/");
      showToast("Logout successful!", "success");
    } catch (err) {
      showToast("Logout failed!", "error");
      console.error("Logout failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGGED IN STATE ---
  if (user) {
    return (
      <div className="flex items-center gap-3">
        {/* Interactive Clickable Profile Avatar with Hover Tooltip */}
        <div
          onClick={() => navigate("/profile")}
          className="relative group flex items-center gap-2.5 cursor-pointer p-3 transition-all duration-200"
        >
          {/* Tooltip Popup on Hover */}
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
            <span className="bg-slate-900 text-slate-200 text-[11px] font-semibold px-5 py-1 rounded-lg border border-slate-700/80 shadow-xl whitespace-nowrap flex items-center gap-1">
              <UserIcon className="w-3 h-3 text-emerald-400" />
              View Profile
            </span>
          </div>

          {/* Avatar Container */}
          <div className="relative">
            {user.photoURL ? (
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-emerald-500/50 group-hover:ring-emerald-400 group-hover:scale-105 transition-all duration-200 shadow-md">
                <img
                  src={user.photoURL}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/octo.png";
                  }}
                  alt="img"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center group-hover:ring-2 group-hover:ring-emerald-400 group-hover:scale-105 transition-all duration-200 shadow-md">
                {user.displayName?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
          </div>

          <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors hidden sm:inline">
            {user.displayName}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="btn btn-outline btn-error btn-sm gap-2"
        >
          {loading ? (
            <span className="loading loading-spinner loading-xs dark:text-neutral"></span>
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span className="max-sm:hidden">Logout</span>
        </button>
      </div>
    );
  }

  // --- LOGGED OUT STATE ---
  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="btn bg-green-300 gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm dark:text-neutral"></span>
      ) : (
        /* Official Google Icon SVG */
        <svg
          className="w-4 h-4 bg-white rounded-full p-0.5"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span className="max-sm:hidden dark:text-black">
        Continue with Google
      </span>
    </button>
  );
};

export default LoginButton;
