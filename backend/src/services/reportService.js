const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} = require("date-fns");
const { execute } = require("../db/mysql");

function buildRange(period, dateString, startDate, endDate) {
  const baseDate = dateString ? new Date(dateString) : new Date();
  if (period === "daily") {
    return { from: startOfDay(baseDate), to: endOfDay(baseDate), label: "Daily" };
  }

  if (period === "weekly") {
    const weekStart = startDate ? new Date(startDate) : startOfWeek(baseDate, { weekStartsOn: 1 });
    const weekEnd = endDate ? new Date(endDate) : endOfWeek(weekStart, { weekStartsOn: 1 });
    return { from: startOfDay(weekStart), to: endOfDay(weekEnd), label: "Weekly" };
  }

  const monthStart = startDate ? new Date(startDate) : startOfMonth(baseDate);
  const monthEnd = endDate ? new Date(endDate) : endOfMonth(monthStart);
  return { from: startOfDay(monthStart), to: endOfDay(monthEnd), label: "Monthly" };
}

function buildReportFilters(filters) {
  const conditions = ["tr.tested_at >= ?", "tr.tested_at <= ?"];
  const params = [];

  if (filters.instrumentType) {
    conditions.push("i.instrument_type = ?");
    params.push(filters.instrumentType);
  }

  if (filters.category) {
    conditions.push("c.name = ?");
    params.push(filters.category);
  }

  if (filters.result) {
    conditions.push("tr.result = ?");
    params.push(filters.result);
  }

  if (filters.testedBy) {
    conditions.push("tr.tested_by = ?");
    params.push(filters.testedBy);
  }

  return { conditions, params };
}

async function getReportData(filters) {
  const period = filters.period || "daily";
  const range = buildRange(period, filters.date, filters.startDate, filters.endDate);
  const filterOptions = buildReportFilters(filters);

  const query = `SELECT
      tr.tested_at,
      i.name AS instrument_name,
      i.serial_number,
      i.instrument_type,
      c.name AS category,
      tr.result,
      tr.test_count,
      tr.continuity_detection,
      tr.resistance_value,
      tr.force_value,
      tr.current_value,
      tr.repeated_failure_alert,
      tr.remarks,
      u.full_name AS tested_by_name
    FROM test_records tr
    JOIN instruments i ON tr.instrument_id = i.id
    JOIN categories c ON tr.category_id = c.id
    JOIN users u ON tr.tested_by = u.id
    WHERE ${["tr.tested_at >= ?", "tr.tested_at <= ?", ...filterOptions.conditions.slice(2)].join(" AND ")}
    ORDER BY tr.tested_at DESC`; // filterOptions conditions already contain instrumentType/category/result/testedBy

  const rows = await execute(query, [range.from, range.to, ...filterOptions.params]);
  const records = rows.map((row) => ({
    tested_at: row.tested_at,
    instrument_name: row.instrument_name,
    serial_number: row.serial_number,
    instrument_type: row.instrument_type,
    category: row.category,
    result: row.result,
    test_count: row.test_count,
    continuity_detection: Boolean(row.continuity_detection),
    resistance_value: row.resistance_value,
    force_value: row.force_value,
    current_value: row.current_value,
    repeated_failure_alert: Boolean(row.repeated_failure_alert),
    remarks: row.remarks,
    tested_by_name: row.tested_by_name,
  }));

  const summary = records.reduce(
    (acc, row) => {
      acc.total_tests += 1;
      if (row.result === "Pass") acc.total_pass += 1;
      if (row.result === "Fail") acc.total_fail += 1;
      if (row.repeated_failure_alert) acc.repeated_failure_alerts += 1;
      return acc;
    },
    { total_tests: 0, total_pass: 0, total_fail: 0, repeated_failure_alerts: 0 }
  );

  return {
    range,
    summary,
    records,
  };
}

async function buildExcelReport(reportData) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Instrument Report");

  sheet.addRow(["Surgical Instrument Testing Report"]);
  sheet.addRow([`Period: ${reportData.range.label}`]);
  sheet.addRow([`From: ${format(reportData.range.from, "yyyy-MM-dd HH:mm:ss")} | To: ${format(reportData.range.to, "yyyy-MM-dd HH:mm:ss")}`]);
  sheet.addRow([]);
  sheet.addRow([
    "Instrument Name",
    "Serial Number",
    "Type",
    "Category",
    "Result",
    "Test Count",
    "Continuity",
    "Resistance",
    "Force",
    "Current",
    "Repeated Failure",
    "Tested By",
    "Tested At",
    "Remarks",
  ]);

  reportData.records.forEach((record) => {
    sheet.addRow([
      record.instrument_name,
      record.serial_number,
      record.instrument_type,
      record.category,
      record.result,
      record.test_count,
      record.continuity_detection ? "Detected" : "Not Detected",
      Number(record.resistance_value),
      Number(record.force_value),
      Number(record.current_value),
      record.repeated_failure_alert ? "Yes" : "No",
      record.tested_by_name,
      format(new Date(record.tested_at), "yyyy-MM-dd HH:mm:ss"),
      record.remarks || "",
    ]);
  });

  sheet.columns.forEach((column) => {
    column.width = 18;
  });

  return workbook.xlsx.writeBuffer();
}

async function buildPdfReport(reportData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 24, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text("Surgical Instrument Testing Report");
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Period: ${reportData.range.label}`);
    doc.text(`From: ${format(reportData.range.from, "yyyy-MM-dd HH:mm:ss")}`);
    doc.text(`To: ${format(reportData.range.to, "yyyy-MM-dd HH:mm:ss")}`);
    doc.moveDown();
    doc.text(
      `Total: ${reportData.summary.total_tests} | Pass: ${reportData.summary.total_pass} | Fail: ${reportData.summary.total_fail} | Alerts: ${reportData.summary.repeated_failure_alerts}`
    );
    doc.moveDown();

    reportData.records.slice(0, 200).forEach((record, index) => {
      doc
        .fontSize(9)
        .text(
          `${index + 1}. ${record.instrument_name} | ${record.serial_number} | ${record.result} | R:${record.resistance_value} F:${record.force_value} C:${record.current_value} | ${format(new Date(record.tested_at), "yyyy-MM-dd HH:mm")}`
        );
    });

    if (reportData.records.length > 200) {
      doc.moveDown().text(`...${reportData.records.length - 200} more records omitted in PDF preview.`);
    }

    doc.end();
  });
}

module.exports = {
  getReportData,
  buildExcelReport,
  buildPdfReport,
};
