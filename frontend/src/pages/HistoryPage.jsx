import { useState } from "react";
import { Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/client";
import { formatDate } from "../utils/format";

function HistoryPage() {
  const [serialNumber, setSerialNumber] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (event) => {
    event.preventDefault();
    if (!serialNumber.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await api.get(`/tests/history/${encodeURIComponent(serialNumber.trim())}`);
      setData(res.data);
    } catch (err) {
      setData(null);
      setError(err.response?.data?.message || "Unable to fetch history");
    } finally {
      setLoading(false);
    }
  };

  const trendData = data
    ? [
        { name: "Pass", count: data.totals.passed },
        { name: "Fail", count: data.totals.failed },
      ]
    : [];

  return (
    <section className="space-y-4">
      <div className="panel p-4">
        <h2 className="text-lg font-semibold">Instrument History Tracking</h2>
        <p className="text-sm text-muted">
          Search by serial number to view complete test history, values, and pass/fail trends.
        </p>
      </div>

      <form className="panel flex flex-wrap items-end gap-3 p-4" onSubmit={search}>
        <div className="w-full max-w-md space-y-2">
          <label className="text-sm font-medium">Serial Number</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 text-muted" size={16} />
            <input
              className="input-base pl-9"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="M25022026 1234"
            />
          </div>
        </div>
        <button className="btn-primary" type="submit">
          {loading ? "Searching..." : "Search History"}
        </button>
        {error && <p className="w-full text-sm text-danger">{error}</p>}
      </form>

      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="panel p-4">
              <p className="text-xs text-muted">Instrument</p>
              <p className="font-semibold">{data.instrument.name}</p>
            </div>
            <div className="panel p-4">
              <p className="text-xs text-muted">Total Number of Tests</p>
              <p className="text-2xl font-bold">{data.totals.total}</p>
            </div>
            <div className="panel p-4">
              <p className="text-xs text-muted">Pass Rate</p>
              <p className="text-2xl font-bold text-success">{data.trend.passRate}%</p>
            </div>
            <div className="panel p-4">
              <p className="text-xs text-muted">Fail Rate</p>
              <p className="text-2xl font-bold text-danger">{data.trend.failRate}%</p>
            </div>
          </div>

          <div className="panel p-4">
            <h3 className="text-sm font-semibold">Pass/Fail Trend</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f4c81" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel p-4">
            <h3 className="mb-3 text-sm font-semibold">Full Testing History</h3>
            <div className="overflow-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="py-2">Tested At</th>
                    <th className="py-2">Result</th>
                    <th className="py-2">Resistance</th>
                    <th className="py-2">Force</th>
                    <th className="py-2">Current</th>
                    <th className="py-2">Continuity</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Test Count</th>
                    <th className="py-2">Alert</th>
                    <th className="py-2">Tested By</th>
                    <th className="py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-2">{formatDate(row.tested_at)}</td>
                      <td className={`py-2 font-semibold ${row.result === "Pass" ? "text-success" : "text-danger"}`}>
                        {row.result}
                      </td>
                      <td className="py-2">{row.resistance_value}</td>
                      <td className="py-2">{row.force_value}</td>
                      <td className="py-2">{row.current_value}</td>
                      <td className="py-2">{row.continuity_detection ? "Detected" : "Not Detected"}</td>
                      <td className="py-2">{row.category}</td>
                      <td className="py-2">{row.test_count}</td>
                      <td className={`py-2 ${row.repeated_failure_alert ? "text-danger" : "text-muted"}`}>
                        {row.repeated_failure_alert ? "Repeated Failures" : "-"}
                      </td>
                      <td className="py-2">{row.tested_by_name}</td>
                      <td className="py-2">{row.remarks || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default HistoryPage;
