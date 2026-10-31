import "./index.css";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ConfirmProvider } from "./context/ConfirmContext";
import { ToastProvider } from "./context/ToastContext";

//***Lazy loading to prevent loading big size components at the same time of the current element***
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CompatibilityChecker = lazy(() => import("./pages/CompatibilityChecker"));
const BrowseReports = lazy(() => import("./pages/BrowseReports"));
const ReportForm = lazy(() => import("./pages/ReportForm"));
const ErrorPage = lazy(() => import("./ErrorPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MyReports = lazy(() => import("./pages/MyReports"));
const Profile = lazy(() => import("./pages/Profile"));
const HeatmapView = lazy(() => import("./pages/HeatmapView"));

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100"><AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Navbar />
            <Suspense
              fallback={
                <main
                  aria-busy="true"
                  className="relative isolate min-h-[60vh] overflow-hidden flex items-center justify-center px-4 bg-slate-950 text-slate-200"
                >
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[100px]"
                  />
                  <section
                    role="status"
                    aria-live="polite"
                    className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl shadow-emerald-950/20 backdrop-blur-xl"
                  >
                    <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center">
                      <span className="absolute inset-0 rounded-2xl bg-emerald-400/10 ring-1 ring-emerald-300/20" />
                      <span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-300/20 border-t-emerald-300 motion-reduce:animate-none" />
                      <span className="absolute h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.9)]" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300">
                      E20 Impact
                    </p>
                    <h1 className="mt-2 text-xl font-black tracking-tight text-white">
                      Getting things ready
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                      Loading your page. This will only take a moment.
                    </p>
                    <div
                      aria-hidden="true"
                      className="mx-auto mt-6 flex w-24 items-center justify-center gap-1.5"
                    >
                      <span className="h-1 w-6 animate-pulse rounded-full bg-emerald-300/80 motion-reduce:animate-none" />
                      <span className="h-1 w-6 animate-pulse rounded-full bg-emerald-300/50 [animation-delay:150ms] motion-reduce:animate-none" />
                      <span className="h-1 w-6 animate-pulse rounded-full bg-emerald-300/30 [animation-delay:300ms] motion-reduce:animate-none" />
                    </div>
                  </section>
                </main>
              }
            >
              <main className="grow"><Routes>
                <Route path="/" element={<CompatibilityChecker />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/report" element={<ReportForm />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-reports" element={<MyReports />} />
                <Route path="/heatmap" element={<HeatmapView />} />
                <Route path="/browse" element={<BrowseReports />} />
                <Route path="*" element={<ErrorPage />} />
              </Routes></main>
            </Suspense>
            <Footer className="relative z-1000 w-full bg-slate-900/80 backdrop-blur-2xl border-t border-slate-800 py-6"/>
          </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider></div>
    
  );
}

export default App;
