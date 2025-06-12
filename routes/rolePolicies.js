const express = require('express');
const db = require('../database/db');
const router = express.Router();

/**
 * Attach a policy to a role
 */
router.post('/', (req, res) => {
  const { roleId, policyId } = req.body;

  if (!roleId || !policyId) {
    return res.status(400).json({ error: 'roleId and policyId are required' });
  }

  const stmt = db.prepare(`
    INSERT INTO role_policies (role_id, policy_id) VALUES (?, ?)
  `);

  stmt.run(roleId, policyId, function (err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: 'Role-policy pair already exists or does not exist' });
      }
      return res.status(500).json({ error: 'Failed to attach policy to role' });
    }

    res.status(201).json({ message: 'Policy attached to role', id: this.lastID });
  });
});

/**
 * Get all policy IDs attached to a role
 */
router.get('/role/:roleId', (req, res) => {
  const { roleId } = req.params;

  const stmt = `
    SELECT policy_id FROM role_policies WHERE role_id = ?
  `;

  db.all(stmt, [roleId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch policies for role' });
    }

    res.json(rows); // returns [{ policy_id: 'abc123' }, ...]
  });
});

/**
 * Get all role IDs that have a specific policy
 */
router.get('/policy/:policyId', (req, res) => {
  const { policyId } = req.params;

  const stmt = `
    SELECT role_id FROM role_policies WHERE policy_id = ?
  `;

  db.all(stmt, [policyId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch roles for policy' });
    }

    res.json(rows); // returns [{ role_id: '1' }, ...]
  });
});

/**
 * Detach a policy from a role
 */
router.delete('/', (req, res) => {
  const { roleId, policyId } = req.body;

  if (!roleId || !policyId) {
    return res.status(400).json({ error: 'roleId and policyId are required' });
  }

  const stmt = db.prepare(`
    DELETE FROM role_policies WHERE role_id = ? AND policy_id = ?
  `);

  stmt.run(roleId, policyId, function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to detach policy from role' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Role-policy pair not found' });
    }

    res.json({ message: 'Policy detached from role' });
  });
});

/**
 * Optional: Get all role-policy mappings
 */
router.get('/', (req, res) => {
  const stmt = `
    SELECT role_id, policy_id FROM role_policies
  `;

  db.all(stmt, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch role-policy mappings' });
    }

    res.json(rows); // returns list of role_id and policy_id pairs
  });
});

module.exports = router;
