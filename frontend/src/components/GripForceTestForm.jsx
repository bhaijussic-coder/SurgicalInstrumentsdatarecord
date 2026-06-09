import { useState, useCallback } from "react";

const ROWS = [
  { sr: 1,  roll: -90, pitch: -50, yaw: -40 },
  { sr: 2,  roll: "",  pitch: "",   yaw: 0   },
  { sr: 3,  roll: "",  pitch: "",   yaw: 40  },
  { sr: 4,  roll: "",  pitch: 0,    yaw: -40 },
  { sr: 5,  roll: "",  pitch: "",   yaw: 0   },
  { sr: 6,  roll: "",  pitch: "",   yaw: 40  },
  { sr: 7,  roll: "",  pitch: 50,   yaw: -40 },
  { sr: 8,  roll: "",  pitch: "",   yaw: 0   },
  { sr: 9,  roll: "",  pitch: "",   yaw: 40  },
  { sr: 10, roll: 0,   pitch: -50,  yaw: -40 },
  { sr: 11, roll: "",  pitch: "",   yaw: 0   },
  { sr: 12, roll: "",  pitch: "",   yaw: 40  },
  { sr: 13, roll: "",  pitch: 0,    yaw: -40 },
  { sr: 14, roll: "",  pitch: "",   yaw: 0   },
  { sr: 15, roll: "",  pitch: "",   yaw: 40  },
  { sr: 16, roll: "",  pitch: 50,   yaw: -40 },
  { sr: 17, roll: "",  pitch: "",   yaw: 0   },
  { sr: 18, roll: "",  pitch: "",   yaw: 40  },
  { sr: 19, roll: 90,  pitch: -50,  yaw: -40 },
  { sr: 20, roll: "",  pitch: "",   yaw: 0   },
  { sr: 21, roll: "",  pitch: "",   yaw: 40  },
  { sr: 22, roll: "",  pitch: 0,    yaw: -40 },
  { sr: 23, roll: "",  pitch: "",   yaw: 0   },
  { sr: 24, roll: "",  pitch: "",   yaw: 40  },
  { sr: 25, roll: "",  pitch: 50,   yaw: -40 },
  { sr: 26, roll: "",  pitch: "",   yaw: 0   },
  { sr: 27, roll: "",  pitch: "",   yaw: 40  },
];

const GROUP_STARTS = new Set([1, 10, 19]);

const styles = {
  wrap: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 13,
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    overflow: "hidden",
    maxWidth: 760,
  },
  badge: {
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: 600,
    textAlign: "center",
    padding: "4px 0",
    borderBottom: "1px solid #dbeafe",
    letterSpacing: "0.05em",
  },
  headerGrid: {
    display: "grid",
    gridTemplateColumns: "160px 1fr 1fr",
    borderBottom: "1px solid #e5e7eb",
  },
  logoCell: {
    padding: "12px 16px",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
  },
  logoText: { fontSize: 17, fontWeight: 600, color: "#111827" },
  logoAccent: { color: "#2563eb" },
  titleCell: {
    padding: "10px 16px",
    borderRight: "1px solid #e5e7eb",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 2,
  },
  metaCell: {
    padding: "8px 14px",
    fontSize: 12,
    color: "#6b7280",
    display: "flex",
    flexDirection: "column",
    gap: 3,
    justifyContent: "center",
  },
  infoRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    borderBottom: "1px solid #e5e7eb",
  },
  infoCell: {
    padding: "7px 12px",
    fontSize: 12,
    color: "#6b7280",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
  },
  infoCellValue: {
    padding: "7px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: "#111827",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
  },
  colHeaders: {
    display: "grid",
    gridTemplateColumns: "40px 80px 80px 80px 90px 90px 90px",
    background: "#f9fafb",
    borderBottom: "2px solid #d1d5db",
  },
  colHeader: {
    padding: "6px 4px",
    fontSize: 11,
    fontWeight: 600,
    color: "#374151",
    textAlign: "center",
    borderRight: "1px solid #e5e7eb",
    lineHeight: 1.3,
  },
  colHeaderEditable: {
    padding: "6px 4px",
    fontSize: 11,
    fontWeight: 600,
    color: "#166534",
    textAlign: "center",
    background: "#f0fdf4",
    borderRight: "1px solid #e5e7eb",
    lineHeight: 1.3,
  },
  dataRow: (isGroupStart) => ({
    display: "grid",
    gridTemplateColumns: "40px 80px 80px 80px 90px 90px 90px",
    borderBottom: "1px solid #f3f4f6",
    borderTop: isGroupStart ? "2px solid #d1d5db" : undefined,
  }),
  cell: {
    padding: "4px 4px",
    textAlign: "center",
    borderRight: "1px solid #f3f4f6",
    color: "#4b5563",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
  },
  editableCell: {
    padding: "2px 2px",
    textAlign: "center",
    borderRight: "1px solid #f3f4f6",
    background: "#f0fdf4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  meanCell: {
    padding: "2px 2px",
    textAlign: "center",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  numInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "inherit",
    color: "#111827",
    padding: "3px 0",
  },
  meanInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "inherit",
    color: "#15803d",
    fontWeight: 600,
    padding: "3px 0",
  },
  footerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderTop: "2px solid #d1d5db",
    background: "#f9fafb",
    flexWrap: "wrap",
    gap: 8,
  },
  avgLabel: { fontSize: 13, fontWeight: 600, color: "#111827" },
  avgValue: { color: "#2563eb", marginLeft: 6 },
  exportBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 12,
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  sigRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    borderTop: "1px solid #e5e7eb",
  },
  sigCell: {
    padding: "8px 16px",
    fontSize: 12,
    color: "#6b7280",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  sigInput: {
    border: "none",
    borderBottom: "1px solid #d1d5db",
    outline: "none",
    fontSize: 12,
    fontFamily: "inherit",
    color: "#111827",
    width: 140,
    background: "transparent",
  },
  prepRow: {
    padding: "8px 16px",
    fontSize: 12,
    color: "#6b7280",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prepInput: {
    border: "none",
    borderBottom: "1px solid #d1d5db",
    outline: "none",
    fontSize: 12,
    fontFamily: "inherit",
    color: "#111827",
    width: 160,
    background: "transparent",
    marginLeft: 8,
  },
};

export default function GripForceTestForm() {
  const [values, setValues] = useState(() =>
    ROWS.map(() => ({ t1: "", t2: "", mean: "" }))
  );
  const [serialNo, setSerialNo] = useState("M21032026 5214");
  const [instrumentName, setInstrumentName] = useState("Maryland Bipolar Forceps");

  const handleChange = useCallback((idx, field, val) => {
    setValues((prev) => {
      const next = prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
      if (field === "t1" || field === "t2") {
        const t1 = field === "t1" ? val : next[idx].t1;
        const t2 = field === "t2" ? val : next[idx].t2;
        const n1 = parseFloat(t1);
        const n2 = parseFloat(t2);
        let mean = "";
        if (!isNaN(n1) && !isNaN(n2)) mean = ((n1 + n2) / 2).toFixed(2);
        else if (!isNaN(n1)) mean = n1.toFixed(2);
        else if (!isNaN(n2)) mean = n2.toFixed(2);
        next[idx] = { ...next[idx], mean };
      }
      return next;
    });
  }, []);

  const averageForce = (() => {
    const vals = values.map((r) => parseFloat(r.mean)).filter((v) => !isNaN(v));
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  })();

  const exportCSV = () => {
    const header = "Sr.No.,Roll(deg),Pitch(deg),Yaw(deg),Gripping Force Test1 (N),Gripping Force Test2 (N),Mean Force (N)\n";
    const rows = ROWS.map((r, i) =>
      `${r.sr},${r.roll},${r.pitch},${r.yaw},${values[i].t1},${values[i].t2},${values[i].mean}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `grip_force_${serialNo || "report"}.csv`;
    a.click();
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.badge}>CONTROLLED COPY</div>

      {/* Top header */}
      <div style={styles.headerGrid}>
        <div style={styles.logoCell}>
          <span style={styles.logoText}>
            SS<span style={styles.logoAccent}>innovations</span>
          </span>
        </div>
        <div style={styles.titleCell}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            Function Test Report
          </div>
          <div style={{ fontSize: 13, color: "#6b7280" }}>Grip Force</div>
        </div>
        <div style={styles.metaCell}>
          <span>
            <strong style={{ color: "#111827" }}>Document No:</strong> Annexure-1
          </span>
          <span>
            <strong style={{ color: "#111827" }}>Revision No:</strong> 1.0
          </span>
          <span>
            <strong style={{ color: "#111827" }}>Effective Date:</strong>{" "}
            23-10-2025
          </span>
        </div>
      </div>

      {/* Instrument info row */}
      <div style={styles.infoRow}>
        <div style={styles.infoCell}>Instrument Name</div>
        <div style={{ ...styles.infoCell, borderRight: "1px solid #e5e7eb" }}>
          <input
            value={instrumentName}
            onChange={(e) => setInstrumentName(e.target.value)}
            style={{
              border: "none",
              borderBottom: "1px solid #d1d5db",
              outline: "none",
              fontSize: 12,
              fontFamily: "inherit",
              color: "#111827",
              fontWeight: 600,
              width: "100%",
              background: "transparent",
            }}
          />
        </div>
        <div style={styles.infoCell}>Serial No</div>
        <div style={{ ...styles.infoCell, borderRight: "none" }}>
          <input
            value={serialNo}
            onChange={(e) => setSerialNo(e.target.value)}
            style={{
              border: "none",
              borderBottom: "1px solid #d1d5db",
              outline: "none",
              fontSize: 12,
              fontFamily: "inherit",
              color: "#111827",
              fontWeight: 600,
              width: "100%",
              background: "transparent",
            }}
          />
        </div>
      </div>

      {/* Column headers */}
      <div style={styles.colHeaders}>
        <div style={styles.colHeader}>Sr. No.</div>
        <div style={styles.colHeader}>Roll (deg)</div>
        <div style={styles.colHeader}>Pitch (deg)</div>
        <div style={styles.colHeader}>Yaw (deg)</div>
        <div style={styles.colHeaderEditable}>
          Gripping Force (N)
          <br />
          Test 1
        </div>
        <div style={styles.colHeaderEditable}>
          Gripping Force (N)
          <br />
          Test 2
        </div>
        <div style={{ ...styles.colHeaderEditable, borderRight: "none" }}>
          Mean Force (N)
        </div>
      </div>

      {/* Data rows */}
      {ROWS.map((row, i) => (
        <div key={row.sr} style={styles.dataRow(GROUP_STARTS.has(row.sr))}>
          <div style={styles.cell}>{row.sr}</div>
          <div style={styles.cell}>{row.roll !== "" ? row.roll : ""}</div>
          <div style={styles.cell}>{row.pitch !== "" ? row.pitch : ""}</div>
          <div style={styles.cell}>{row.yaw !== "" ? row.yaw : ""}</div>
          <div style={styles.editableCell}>
            <input
              type="number"
              step="0.01"
              value={values[i].t1}
              placeholder="—"
              onChange={(e) => handleChange(i, "t1", e.target.value)}
              style={styles.numInput}
            />
          </div>
          <div style={styles.editableCell}>
            <input
              type="number"
              step="0.01"
              value={values[i].t2}
              placeholder="—"
              onChange={(e) => handleChange(i, "t2", e.target.value)}
              style={styles.numInput}
            />
          </div>
          <div style={styles.meanCell}>
            <input
              type="number"
              step="0.01"
              value={values[i].mean}
              placeholder="auto"
              onChange={(e) => handleChange(i, "mean", e.target.value)}
              style={styles.meanInput}
            />
          </div>
        </div>
      ))}

      {/* Footer */}
      <div style={styles.footerRow}>
        <span style={styles.avgLabel}>
          Average Force (N):
          <span style={styles.avgValue}>
            {averageForce !== null ? `${averageForce} N` : "—"}
          </span>
        </span>
        <button style={styles.exportBtn} onClick={exportCSV}>
          ↓ Export CSV
        </button>
      </div>

      {/* Signature row */}
      <div style={styles.sigRow}>
        <div style={styles.sigCell}>
          Signature:
          <input placeholder="Sign here" style={styles.sigInput} />
        </div>
        <div style={{ ...styles.sigCell, borderRight: "none" }}>
          Date:
          <input type="date" style={styles.sigInput} />
        </div>
      </div>

      {/* Prepared by */}
      <div style={styles.prepRow}>
        <span>
          Prepared by:
          <input placeholder="Name" style={styles.prepInput} />
        </span>
        <span style={{ fontSize: 10, color: "#9ca3af" }}>
          Reference Doc No: SOP_015-DH-011
        </span>
      </div>
    </div>
  );
}
