import { useEffect, useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const defaultForm = {
  instrumentName: "",
  serialNumber: "",
  instrumentType: "Production",
  category: "Fresh",
  continuityDetection: "Detected",
  resistanceValue: 0,
  forceValue: 0,
  currentValue: 0,
  result: "Pass",
  testedAt: new Date().toISOString().slice(0, 16),
  remarks: "",
};

function TestEntryPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const recordId = searchParams.get("recordId");
  const [form, setForm] = useState(defaultForm);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef(null);

  const canEdit = useMemo(() => ["admin", "tester"].includes(user.role), [user.role]);

  const setField = (key, value) => setForm((curr) => ({ ...curr, [key]: value }));

  useEffect(() => {
    if (!recordId) return;
    api
      .get(`/tests/${recordId}`)
      .then((res) => {
        const row = res.data;
        setForm({
          instrumentName: row.instrument_name,
          serialNumber: row.serial_number,
          instrumentType: row.instrument_type,
          category: row.category,
          continuityDetection: row.continuity_detection ? "Detected" : "Not Detected",
          resistanceValue: row.resistance_value,
          forceValue: row.force_value,
          currentValue: row.current_value,
          result: row.result,
          testedAt: new Date(row.tested_at).toISOString().slice(0, 16),
          remarks: row.remarks || "",
        });
      })
      .catch(() => setMessage("Unable to load selected record for edit."));
  }, [recordId]);

  const startScanner = async () => {
    if (!canEdit) return;
    setScannerOpen(true);
    const { Html5QrcodeScanner } = await import("html5-qrcode");
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "serial-scanner",
      { fps: 10, qrbox: { width: 240, height: 120 } },
      false
    );
    scanner.render(
      (decodedText) => {
        setField("serialNumber", decodedText);
        scanner
          .clear()
          .finally(() => {
            scannerRef.current = null;
            setScannerOpen(false);
          })
          .catch(() => undefined);
      },
      () => undefined
    );
    scannerRef.current = scanner;
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScannerOpen(false);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!canEdit) return;
    setMessage("");
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        resistanceValue: Number(form.resistanceValue),
        forceValue: Number(form.forceValue),
        currentValue: Number(form.currentValue),
        testedAt: new Date(form.testedAt).toISOString(),
      };
      const res = recordId
        ? await api.put(`/tests/${recordId}`, payload)
        : await api.post("/tests", payload);
      setMessage(
        `${recordId ? "Updated" : "Saved"}: ${res.data.instrument_name} (${res.data.serial_number}) test count is now ${res.data.test_count}.`
      );
      setForm((curr) => ({
        ...defaultForm,
        testedAt: new Date().toISOString().slice(0, 16),
        instrumentName: curr.instrumentName,
      }));
      if (recordId) {
        setSearchParams({});
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to save test record");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="panel p-4">
        <h2 className="text-lg font-semibold">Daily Instrument Testing Entry</h2>
        <p className="text-sm text-muted">Fast entry form with auto test-count tracking and serial history.</p>
        {recordId && <p className="mt-2 text-sm text-brand">Editing existing record</p>}
      </div>

      {!canEdit && (
        <div className="panel border-danger/60 p-4 text-sm text-danger">
          You have view-only access. Tester or Admin role is required to create/edit records.
        </div>
      )}

      <form onSubmit={onSubmit} className="panel grid gap-4 p-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Instrument Name</label>
          <input
            className="input-base"
            value={form.instrumentName}
            disabled={!canEdit}
            onChange={(e) => setField("instrumentName", e.target.value)}
            placeholder="Large Needle Driver (LND)"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Instrument Serial Number</label>
          <div className="flex gap-2">
            <input
              className="input-base"
              value={form.serialNumber}
              disabled={!canEdit}
              onChange={(e) => setField("serialNumber", e.target.value)}
              placeholder="M25022026 1234"
              required
            />
            <button type="button" className="btn-secondary" onClick={scannerOpen ? stopScanner : startScanner}>
              <Camera size={16} />
            </button>
          </div>
          {scannerOpen && <div id="serial-scanner" className="rounded-lg border border-border p-2" />}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Instrument Type</label>
          <select
            className="input-base"
            value={form.instrumentType}
            disabled={!canEdit}
            onChange={(e) => setField("instrumentType", e.target.value)}
          >
            <option value="Production">Production</option>
            <option value="R&D">R&D</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select
            className="input-base"
            value={form.category}
            disabled={!canEdit}
            onChange={(e) => setField("category", e.target.value)}
          >
            <option value="Fresh">Fresh</option>
            <option value="Rework">Rework</option>
            <option value="For Trial">For Trial</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Continuity Detection</label>
          <select
            className="input-base"
            value={form.continuityDetection}
            disabled={!canEdit}
            onChange={(e) => {
              const value = e.target.value;
              setField("continuityDetection", value);
              setField("result", value === "Detected" ? "Pass" : "Fail");
            }}
          >
            <option value="Detected">Detected</option>
            <option value="Not Detected">Not Detected</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Resistance Value</label>
          <input
            className="input-base"
            type="number"
            step="0.0001"
            min="0"
            value={form.resistanceValue}
            disabled={!canEdit}
            onChange={(e) => setField("resistanceValue", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Force Value (Newton)</label>
          <input
            className="input-base"
            type="number"
            step="0.0001"
            min="0"
            value={form.forceValue}
            disabled={!canEdit}
            onChange={(e) => setField("forceValue", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Current Value (Ampere)</label>
          <input
            className="input-base"
            type="number"
            step="0.0001"
            min="0"
            value={form.currentValue}
            disabled={!canEdit}
            onChange={(e) => setField("currentValue", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Result (Pass/Fail)</label>
          <select
            className="input-base"
            value={form.result}
            disabled={!canEdit}
            onChange={(e) => setField("result", e.target.value)}
          >
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Date of Testing</label>
          <input
            className="input-base"
            type="datetime-local"
            value={form.testedAt}
            disabled={!canEdit}
            onChange={(e) => setField("testedAt", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tested By</label>
          <input className="input-base" value={user.full_name} readOnly />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Remarks / Notes</label>
          <textarea
            className="input-base min-h-[90px]"
            value={form.remarks}
            disabled={!canEdit}
            onChange={(e) => setField("remarks", e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <button disabled={!canEdit || isSubmitting} className="btn-primary" type="submit">
            {isSubmitting ? "Saving..." : "Save Test Record"}
          </button>
        </div>

        {message && (
          <div className="md:col-span-2">
            <p className="text-sm text-muted">{message}</p>
          </div>
        )}
      </form>
    </section>
  );
}

export default TestEntryPage;
