import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import LoginButton from "./LoginButton";
import { useAuth } from "../context/AuthContext";
import api from "../api/api"; // Your custom axios instance

const Navbar = () => {
  const routerlocation = useLocation();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    if (!user) {
      setIsAdmin(false);
      return () => {
        active = false;
      };
    }
    setIsAdmin(false);
    api
      .post("/auth/sync", { displayName: user.displayName || "User" })
      .then((res) => {
        if (active) setIsAdmin(res.data?.role === "admin");
      })
      .catch((err) => {
        console.error("Failed to determine admin access:", err.message);
        if (active) setIsAdmin(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const baseNavLinks = [
    { name: "Checker", path: "/" },
    { name: "Report Issue", path: "/report" },
    { name: "Dashboard", path: "/dashboard" },
    { name: "Heatmap", path: "/heatmap" },
    { name: "Browse", path: "/browse" },
    { name: "My Reports", path: "/my-reports" },
  ];

  // Dynamically append Admin link if user is an admin
  const navLinks = isAdmin
    ? [...baseNavLinks, { name: "Admin", path: "/admin", isAdminOnly: true }]
    : baseNavLinks;

  return (
    <header className="fixed top-0 z-1000 w-full border-b border-white/10 bg-slate-950/40 backdrop-blur-md transition-colors duration-200">
      <div className="navbar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 min-h-16 text-white">
        {/* Left: Branding & Mobile Drawer Toggle */}
        <div className="navbar-start gap-2">
          <div className="dropdown lg:hidden">
            <label
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle btn-sm text-white/80 hover:text-white hover:bg-white/10 focus-visible:outline-none"
              aria-label="Open Navigation Menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 opacity-80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </label>

            <ul
              tabIndex={0}
              className="dropdown-content menu menu-md z-100 p-2 shadow-2xl bg-slate-900/90 backdrop-blur-xl rounded-2xl w-60 border border-white/15 gap-1 mt-5 text-white"
            >
              <li className="menu-title px-3 py-1.5 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                Navigation
              </li>
              {navLinks.map((link) => {
                const isActive = routerlocation.pathname === link.path;
                return (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`rounded-xl py-2 px-3 transition-colors ${
                        isActive
                          ? "bg-emerald-500 text-slate-950 font-semibold"
                          : link.isAdminOnly
                          ? "text-amber-400 hover:bg-amber-500/10"
                          : "hover:bg-white/10 text-white/80 hover:text-white"
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Logo with custom badge styling */}
          <Link
            to="/"
            className="flex items-center gap-2 group py-1 focus-visible:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-sm tracking-tighter group-hover:bg-emerald-300 transition-all duration-300 shadow-sm">
              E
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Twenty<span className="text-emerald-400">.</span>
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-1">
            {navLinks.map((link) => {
              const isActive = routerlocation.pathname === link.path;
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
                        : link.isAdminOnly
                        ? "border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 font-semibold"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: Actions & Controls */}
        <div className="navbar-end gap-2.5">
          <LoginButton />
        </div>
      </div>
    </header>
  );
};

export default Navbar;