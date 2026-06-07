const { readReconciliationReport } = require("../repositories/reconciliation.repository");

async function getAdminReconciliationReport() {
  return readReconciliationReport();
}

module.exports = {
  getAdminReconciliationReport
};
