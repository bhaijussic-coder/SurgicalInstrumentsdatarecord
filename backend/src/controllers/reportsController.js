const { format } = require("date-fns");
const reportService = require("../services/reportService");

async function getReport(req, res) {
  const reportData = await reportService.getReportData(req.query);
  res.json(reportData);
}

async function exportReport(req, res) {
  const formatType = req.query.format || "excel";
  const reportData = await reportService.getReportData(req.query);
  const stamp = format(new Date(), "yyyyMMdd_HHmmss");

  if (formatType === "pdf") {
    const buffer = await reportService.buildPdfReport(reportData);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=instrument_report_${stamp}.pdf`);
    return res.send(buffer);
  }

  const buffer = await reportService.buildExcelReport(reportData);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=instrument_report_${stamp}.xlsx`);
  return res.send(Buffer.from(buffer));
}

module.exports = {
  getReport,
  exportReport,
};
