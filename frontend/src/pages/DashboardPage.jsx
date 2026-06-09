import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("tested_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async (searchValue = "", customSortBy = sortBy, customSortOrder = sortOrder) => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, rowsRes] = await Promise.all([
        api.get("/tests/dashboard-summary"),
        api.get("/tests", {
          params: { pageSize: 100, search: searchValue, sortBy: customSortBy, sortOrder: customSortOrder },
        }),
      ]);
      setSummary(summaryRes.data);
      setRows(rowsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load dashboard data");
      setSummary(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData(search, sortBy, sortOrder);
  }, [sortBy, sortOrder]);

  const chartData = useMemo(() => {
    const dayMap = new Map();
    rows.forEach((row) => {
      const key = new Date(row.tested_at).toLocaleDateString();
      if (!dayMap.has(key)) dayMap.set(key, { day: key, Pass: 0, Fail: 0 });
      dayMap.get(key)[row.result] += 1;
    });
    return [...dayMap.values()].slice(-10);
  }, [rows]);

  const onSearch = (event) => {
    event.preventDefault();
    fetchData(search);
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Instruments Tested Today" value={summary?.total_tested_today ?? 0} tone="brand" />
        <StatCard label="Total Passed Instruments" value={summary?.total_passed_today ?? 0} tone="success" />
        <StatCard label="Total Failed Instruments" value={summary?.total_failed_today ?? 0} tone="danger" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="panel p-4">
          <h2 className="text-lg font-semibold">Pass/Fail Trend</h2>
          <p className="mb-4 text-sm text-muted">Last 10 days from recent records</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="passGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14833b" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#14833b" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="failGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b42318" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#b42318" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="Pass" stroke="#14833b" fill="url(#passGradient)" />
                <Area type="monotone" dataKey="Fail" stroke="#b42318" fill="url(#failGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <h2 className="text-lg font-semibold">Quick Status</h2>
          <div className="mt-3 space-y-3 text-sm">
            <div className="rounded-lg border border-border p-3">
              <p className="text-muted">Recent Tests</p>
              <p className="text-xl font-bold">{summary?.recent?.length ?? 0}</p>
            </div>
            <div className="rounded-lg border border-danger/40 bg-danger/10 p-3">
              <p className="mb-1 flex items-center gap-2 text-danger">
                <AlertTriangle size={16} />
                Repeated Failure Alerts
              </p>
              <p className="text-xl font-bold text-danger">
                {(summary?.recent || []).filter((item) => item.repeated_failure_alert).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="panel p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Recently Tested Instruments</h2>
          <form onSubmit={onSearch} className="flex w-full max-w-4xl flex-wrap items-center gap-2">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-muted" size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-9"
                placeholder="Search serial or instrument name"
              />
            </div>
            <select className="input-base max-w-[160px]" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="tested_at">Sort: Date</option>
              <option value="serial_number">Sort: Serial</option>
              <option value="instrument_name">Sort: Name</option>
              <option value="result">Sort: Result</option>
              <option value="test_count">Sort: Test Count</option>
            </select>
            <select className="input-base max-w-[120px]" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <button className="btn-primary" type="submit">
              Search
            </button>
          </form>
        </div>
        {error && <p className="mb-3 text-sm text-danger">{error}</p>}

        <div className="overflow-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2">Instrument</th>
                <th className="py-2">Serial Number</th>
                <th className="py-2">Type</th>
                <th className="py-2">Category</th>
                <th className="py-2">Result</th>
                <th className="py-2">Test Count</th>
                <th className="py-2">Tested By</th>
                <th className="py-2">Tested At</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-muted">
                    Loading records...
                  </td>
                </tr>
              )}
              {!loading &&
                rows.slice(0, 20).map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="py-2">{row.instrument_name}</td>
                    <td className="py-2">{row.serial_number}</td>
                    <td className="py-2">{row.instrument_type}</td>
                    <td className="py-2">{row.category}</td>
                    <td className={`py-2 font-semibold ${row.result === "Pass" ? "text-success" : "text-danger"}`}>
                      {row.result}
                    </td>
                    <td className="py-2">{row.test_count}</td>
                    <td className="py-2">{row.tested_by_name}</td>
                    <td className="py-2">{formatDate(row.tested_at)}</td>
                    <td className="py-2">
                      {["admin", "tester"].includes(user.role) ? (
                        <button
                          type="button"
                          className="btn-secondary py-1 text-xs"
                          onClick={() => navigate(`/test-entry?recordId=${row.id}`)}
                        >
                          Edit
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-muted">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;
