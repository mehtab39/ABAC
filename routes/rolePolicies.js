const express = require('express');
const db = require('../database/db');
const router = express.Router();

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
        return res.status(409).json({ error: 'Role-policy pair already exists or role does not exist' });
      }
      return res.status(500).json({ error: 'Failed to attach policy to role' });
    }

    res.status(201).json({ message: 'Policy attached to role', id: this.lastID });
  });
});


module.exports = router;