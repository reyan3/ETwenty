import { lazy, Suspense, useEffect, useState } from "react";
import api from "../api/api";

const DashboardCharts = lazy(() => import("../components/DashboardCharts"));

// Month labels mapping
const MONTH_LABELS = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

const formatIssueLabel = (value) =>
  String(value ?? "").toUpperCase().replace(/_/g, " ").trim();

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/dashboard/stats");
        setStats(res?.data ?? {});
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard metrics. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Skeleton Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pt-20 sm:p-20 lg:py-30 space-y-8 font-sans animate-pulse">
        {/* Skeleton Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <div className="h-8 w-64 sm:w-96 bg-slate-800/80 rounded-lg" />
            <div className="h-4 w-48 sm:w-72 bg-slate-800/50 rounded-md" />
          </div>
          <div className="h-8 w-32 bg-slate-800/60 rounded-full" />
        </div>

        {/* Skeleton KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-lg space-y-3"
            >
              <div className="h-3 w-28 bg-slate-800/70 rounded" />
              <div className="h-8 w-24 bg-slate-800 rounded-lg" />
              <div className="h-3 w-36 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>

        {/* Skeleton Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-lg space-y-4"
            >
              {/* Chart Title Placeholder */}
              <div className="h-5 w-48 bg-slate-800/80 rounded-md mb-2" />

              {/* Mock Visual Area for Chart */}
              <div className="h-72 w-full bg-slate-800/30 rounded-xl flex items-end justify-between p-4 gap-2">
                <div className="w-1/6 h-2/5 bg-slate-800/60 rounded-t-md" />
                <div className="w-1/6 h-4/5 bg-slate-800/80 rounded-t-md" />
                <div className="w-1/6 h-3/5 bg-slate-800/60 rounded-t-md" />
                <div className="w-1/6 h-full bg-slate-800/80 rounded-t-md" />
                <div className="w-1/6 h-1/2 bg-slate-800/60 rounded-t-md" />
                <div className="w-1/6 h-3/4 bg-slate-800/70 rounded-t-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center p-6 text-slate-300">
        <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-2xl max-w-md text-center">
          <p className="text-red-400 font-semibold mb-2">Error Loading Data</p>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const safeStats = stats ?? {};

  // Data Processors
  const monthData = (safeStats.byMonth || []).map((d) => ({
    label: `${MONTH_LABELS[d._id?.month] || d._id?.month} ${d._id?.year}`,
    count: Number(d.count) || 0,
  }));

  const districtData = (safeStats.byDistrict || []).map((d) => ({
    label: `${d._id?.district}, ${d._id?.state}`,
    count: Number(d.count) || 0,
  }));

  // Summary Metrics Calculations
  const totalComplaints = (safeStats.byState || []).reduce(
    (acc, curr) => acc + (Number(curr.count) || 0),
    0,
  );

  const repairCostMap = new Map(
    (safeStats.avgRepairCostByIssue || []).map((item) => [
      String(item._id), Number(item.avgRepairCost) || 0,
    ]),
  );

  const topIssue = (safeStats.byIssueType || []).reduce((max, item) => {
    if (!max) return item;

    if (Number(item.count) > Number(max.count)) return item;

    if (Number(item.count) === Number(max.count)) {
      const itemCost = repairCostMap.get(String(item._id)) || 0;
      const maxCost = repairCostMap.get(String(max._id)) || 0;

      return itemCost > maxCost ? item : max;
    }

    return max;
  }, null);

  const repairCostStats = safeStats.avgRepairCostByIssue || [];
  const totalRepairCostReports = repairCostStats.reduce(
    (total, item) => total + (Number(item.repairCostCount) || 0),
    0,
  );
  const avgCost = totalRepairCostReports
    ? Math.round(
        repairCostStats.reduce((total, item) => {
          const costCount = Number(item.repairCostCount) || 0;
          const categoryAverage = Number(item.avgRepairCost) || 0;
          return total + categoryAverage * costCount;
        }, 0) / totalRepairCostReports,
      )
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pt-20 sm:p-20 lg:py-30 space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white bg-clip-text bg-linear-to-r from-white via-slate-200 to-indigo-300">
            E20 Complaint Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time breakdown of vehicle issues, locations, and repair costs.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10  border border-indigo-500/20 w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Real Insights
        </span>
      </div>

      {/* KPI Key Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Total Complaints
          </span>
          <p className="text-3xl  font-extrabold mt-2">{totalComplaints}</p>
          <span className="text-xs text-slate-500 mt-2">
            Across all reported regions
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Most Common Issue
          </span>
          <p className="text-2xl font-bold text-red-400 mt-2 truncate">
            {formatIssueLabel(topIssue?._id) || "N/A"}
          </p>
          <span className="text-xs text-slate-500 mt-2 font-bold underline">
            {topIssue
              ? `${topIssue.count.toLocaleString()} occurrences`
              : "No data available"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Avg Repair Cost
          </span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">
            ₹{avgCost.toLocaleString()}
          </p>
          <span className="text-xs text-slate-500 mt-2">
            Average across reports with repair costs
          </span>
        </div>
      </div>

      <Suspense
        fallback={
          <div
            aria-busy="true"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-4"
              >
                <div className="h-5 w-48 bg-slate-800/80 rounded-md" />
                <div className="h-72 w-full bg-slate-800/30 rounded-xl" />
              </div>
            ))}
          </div>
        }
      >
        <DashboardCharts
          stats={safeStats}
          monthData={monthData}
          districtData={districtData}
        />
      </Suspense>
    </div>
  );
};

export default Dashboard;
