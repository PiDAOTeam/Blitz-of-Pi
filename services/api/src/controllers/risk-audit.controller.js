const { readRiskAuditReport } = require("../repositories/risk-audit.repository");

async function getAdminRiskAuditReport() {
  return readRiskAuditReport();
}

module.exports = {
  getAdminRiskAuditReport
};
