const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    label TEXT,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    role TEXT,
    active INTEGER NOT NULL DEFAULT 1
  );
`);

const normalizeActive = (value) => (value ? 1 : 0);

const getRecipients = (activeOnly = false) => {
  if (activeOnly) {
    return db.prepare('SELECT id, email, label, active FROM recipients WHERE active = 1 ORDER BY id DESC').all();
  }
  return db.prepare('SELECT id, email, label, active FROM recipients ORDER BY id DESC').all();
};

const createRecipient = ({ email, label, active = 1 }) => {
  const stmt = db.prepare('INSERT INTO recipients (email, label, active) VALUES (?, ?, ?)');
  const info = stmt.run(email.trim(), label ? label.trim() : null, normalizeActive(active));
  return db.prepare('SELECT id, email, label, active FROM recipients WHERE id = ?').get(info.lastInsertRowid);
};

const updateRecipient = (id, { email, label, active }) => {
  const stmt = db.prepare('UPDATE recipients SET email = ?, label = ?, active = ? WHERE id = ?');
  stmt.run(email.trim(), label ? label.trim() : null, normalizeActive(active), id);
  return db.prepare('SELECT id, email, label, active FROM recipients WHERE id = ?').get(id);
};

const deleteRecipient = (id) => {
  db.prepare('DELETE FROM recipients WHERE id = ?').run(id);
};

const getEmployees = ({ activeOnly = false, company } = {}) => {
  if (activeOnly && company) {
    return db
      .prepare('SELECT id, name, company, role, active FROM employees WHERE active = 1 AND company = ? ORDER BY name ASC')
      .all(company);
  }
  if (activeOnly) {
    return db
      .prepare('SELECT id, name, company, role, active FROM employees WHERE active = 1 ORDER BY name ASC')
      .all();
  }
  if (company) {
    return db
      .prepare('SELECT id, name, company, role, active FROM employees WHERE company = ? ORDER BY name ASC')
      .all(company);
  }
  return db.prepare('SELECT id, name, company, role, active FROM employees ORDER BY name ASC').all();
};

const createEmployee = ({ name, company, role, active = 1 }) => {
  const stmt = db.prepare('INSERT INTO employees (name, company, role, active) VALUES (?, ?, ?, ?)');
  const info = stmt.run(name.trim(), company ? company.trim() : null, role ? role.trim() : null, normalizeActive(active));
  return db.prepare('SELECT id, name, company, role, active FROM employees WHERE id = ?').get(info.lastInsertRowid);
};

const updateEmployee = (id, { name, company, role, active }) => {
  const stmt = db.prepare('UPDATE employees SET name = ?, company = ?, role = ?, active = ? WHERE id = ?');
  stmt.run(name.trim(), company ? company.trim() : null, role ? role.trim() : null, normalizeActive(active), id);
  return db.prepare('SELECT id, name, company, role, active FROM employees WHERE id = ?').get(id);
};

const deleteEmployee = (id) => {
  db.prepare('DELETE FROM employees WHERE id = ?').run(id);
};

module.exports = {
  getRecipients,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
