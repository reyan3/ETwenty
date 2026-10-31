import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (active && payload && payload.length) {
    const value = Number(payload[0]?.value ?? 0);
    const avgMileageDrop = payload[0]?.payload?.avgMileageDrop;
    const hasAvgMileageDrop =
      avgMileageDrop != null && Number.isFinite(Number(avgMileageDrop));

    if (!Number.isFinite(value)) {
      return null;
    }

    return (
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-slate-300 mb-1">{label}</p>
        <p className="font-medium">
          {`${payload[0].name || "Count"}: ${prefix}${value.toLocaleString()}${suffix}`}
        </p>
        {hasAvgMileageDrop && (
          <p className="mt-1 ">
            Average mileage drop: {Number(avgMileageDrop).toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

const DashboardCharts = ({ stats, monthData, districtData }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg flex flex-col">
      <h3 className="text-base font-semibold text-slate-200 mb-4">
        Complaints Over Time
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={monthData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.5}
            />
            <XAxis
              dataKey="label"
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366F1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg flex flex-col">
      <h3 className="text-base font-semibold text-slate-200 mb-4">
        Complaints by Issue Type
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={stats.byIssueType || []}
              dataKey="count"
              nameKey="_id"
              activeShape={{ fill: "pink" }}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={4}
            >
              {(stats.byIssueType || []).map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#0F172A"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg flex flex-col">
      <h3 className="text-base font-semibold text-slate-200 mb-4">
        Complaints by State
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stats.byState || []}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.5}
            />
            <XAxis
              dataKey="_id"
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg flex flex-col">
      <h3 className="text-base font-semibold text-slate-200 mb-4">
        Complaints by Vehicle Type
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stats.byVehicleType || []}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.5}
            />
            <XAxis
              dataKey="_id"
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg flex flex-col">
      <h3 className="text-base font-semibold text-slate-200 mb-4">
        Average Repair Cost by Issue Type
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stats.avgRepairCostByIssue || []}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.5}
            />
            <XAxis
              dataKey="_id"
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
            />
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
            <Tooltip content={<CustomTooltip prefix="₹" />} />
            <Bar
              dataKey="avgRepairCost"
              fill="#10B981"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-lg flex flex-col">
      <h3 className="text-base font-semibold text-slate-200 mb-4">
        Top Affected Districts
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={districtData}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.5}
            />
            <XAxis
              type="number"
              stroke="#94A3B8"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              dataKey="label"
              type="category"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              width={130}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#EC4899" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);

export default DashboardCharts;
