import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

const initialFilters = {
  period: "daily",
  date: new Date().toISOString().slice(0, 10),
  startDate: "",
  endDate: "",
  instrumentType: "",
  category: "",
  result: "",
  testedBy: "",
};

function ReportsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [report, setReport] = useState(null);
  const [testers, setTesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(nextFilters).filter(([, value]) => value !== "" && value != null)
      );
      const res = await api.get("/reports", { params: cleanParams });
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(initialFilters);
    api.get("/tests/testers").then((res) => setTesters(res.data)).catch(() => undefined);
  }, []);

  const setFilter = (name, value) => setFilters((curr) => ({ ...curr, [name]: value }));

  const applyFilters = (event) => {
    event.preventDefault();
    fetchReport(filters);
  };

  const exportFile = async (format) => {
    setError("");
    setExporting(true);
    try {
      const params = Object.fromEntries(
        Object.entries({ ...filters, format }).filter(([, value]) => value !== "" && value != null)
      );
      const response = await api.get("/reports/export", {
        params,
        responseType: "blob",
      });
      const blob = new Blob([response.data], {
        type:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `instrument_report.${format === "pdf" ? "pdf" : "xlsx"}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="panel p-4">
        <h2 className="text-lg font-semibold">Reports & Filters</h2>
        <p className="text-sm text-muted">Generate daily, weekly, or monthly report snapshots with export.</p>
      </div>

      <form onSubmit={applyFilters} className="panel grid gap-3 p-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Period</label>
          <select className="input-base" value={filters.period} onChange={(e) => setFilter("period", e.target.value)}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <input
            className="input-base"
            type="date"
            value={filters.date}
            onChange={(e) => setFilter("date", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <input
            className="input-base"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilter("startDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">End Date</label>
          <input
            className="input-base"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilter("endDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Instrument Type</label>
          <select
            className="input-base"
            value={filters.instrumentType}
            onChange={(e) => setFilter("instrumentType", e.target.value)}
          >
            <option value="">All</option>
            <option value="Production">Production</option>
            <option value="R&D">R&D</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select className="input-base" value={filters.category} onChange={(e) => setFilter("category", e.target.value)}>
            <option value="">All</option>
            <option value="Fresh">Fresh</option>
            <option value="Rework">Rework</option>
            <option value="For Trial">For Trial</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Pass/Fail</label>
          <select className="input-base" value={filters.result} onChange={(e) => setFilter("result", e.target.value)}>
            <option value="">All</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tested By</label>
          <select className="input-base" value={filters.testedBy} onChange={(e) => setFilter("testedBy", e.target.value)}>
            <option value="">All</option>
            {testers.map((tester) => (
              <option key={tester.id} value={tester.id}>
                {tester.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button className="btn-primary" type="submit">
            {loading ? "Loading..." : "Apply"}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => exportFile("excel")}
            disabled={user.role === "viewer" || exporting}
          >
            <Download size={16} className="mr-1" /> {exporting ? "Exporting..." : "Excel"}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => exportFile("pdf")}
            disabled={user.role === "viewer" || exporting}
          >
            <Download size={16} className="mr-1" /> {exporting ? "Exporting..." : "PDF"}
          </button>
        </div>
        {user.role === "viewer" && (
          <p className="text-xs text-muted md:col-span-2 lg:col-span-4">Viewer role can view reports but cannot export files.</p>
        )}
        {error && <p className="text-sm text-danger md:col-span-2 lg:col-span-4">{error}</p>}
      </form>

      {report && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="panel p-4">
              <p className="text-xs text-muted">Total Tests</p>
              <p className="text-2xl font-bold">{report.summary.total_tests}</p>
            </div>
            <div className="panel p-4">
              <p className="text-xs text-muted">Pass</p>
              <p className="text-2xl font-bold text-success">{report.summary.total_pass}</p>
            </div>
            <div className="panel p-4">
              <p className="text-xs text-muted">Fail</p>
              <p className="text-2xl font-bold text-danger">{report.summary.total_fail}</p>
            </div>
            <div className="panel p-4">
              <p className="text-xs text-muted">Repeated Failure Alerts</p>
              <p className="text-2xl font-bold text-danger">{report.summary.repeated_failure_alerts}</p>
            </div>
          </div>

          <div className="panel p-4">
            <h3 className="mb-3 text-sm font-semibold">Report Records</h3>
            <div className="overflow-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="py-2">Date</th>
                    <th className="py-2">Instrument</th>
                    <th className="py-2">Serial</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Result</th>
                    <th className="py-2">Count</th>
                    <th className="py-2">Resistance</th>
                    <th className="py-2">Force</th>
                    <th className="py-2">Current</th>
                    <th className="py-2">Tested By</th>
                  </tr>
                </thead>
                <tbody>
                  {report.records.map((row, idx) => (
                    <tr key={`${row.serial_number}-${idx}`} className="border-b border-border/60">
                      <td className="py-2">{formatDate(row.tested_at)}</td>
                      <td className="py-2">{row.instrument_name}</td>
                      <td className="py-2">{row.serial_number}</td>
                      <td className="py-2">{row.instrument_type}</td>
                      <td className="py-2">{row.category}</td>
                      <td className={`py-2 font-semibold ${row.result === "Pass" ? "text-success" : "text-danger"}`}>
                        {row.result}
                      </td>
                      <td className="py-2">{row.test_count}</td>
                      <td className="py-2">{row.resistance_value}</td>
                      <td className="py-2">{row.force_value}</td>
                      <td className="py-2">{row.current_value}</td>
                      <td className="py-2">{row.tested_by_name}</td>
                    </tr>
                  ))}
                  {!report.records.length && (
                    <tr>
                      <td colSpan={11} className="py-6 text-center text-muted">
                        No records for current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default ReportsPage;
