const db = require('../db');

module.exports = {
  getRecipients: async (activeOnly = false) => db.getRecipients(activeOnly),
  createRecipient: async (payload) => db.createRecipient(payload),
  updateRecipient: async (id, payload) => db.updateRecipient(id, payload),
  deleteRecipient: async (id) => db.deleteRecipient(id),
  getEmployees: async (filters = {}) => db.getEmployees(filters),
  createEmployee: async (payload) => db.createEmployee(payload),
  updateEmployee: async (id, payload) => db.updateEmployee(id, payload),
  deleteEmployee: async (id) => db.deleteEmployee(id)
};
