const express = require('express');
const db = require('../database/db');
const router = express.Router();


// CREATE
router.post('/', (req, res) => {
  const { id, name, description = '', rules = [] } = req.body;
  if (!id || !name || !Array.isArray(rules)) {
    return res.status(400).json({ error: 'id, name, and rules[] are required' });
  }

  const now = new Date().toISOString();
  const stmt = `
    INSERT INTO policies (id, name, description, rules_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(stmt, [id, name, description, JSON.stringify(rules), now, now], function (err) {
    if (err) {
      console.error('SQLite Error:', err);
      return res.status(500).json({ error: 'Could not store policy' });
    }
    res.status(201).json({ message: 'Policy created', id });
  });
});

// READ ALL
router.get('/', (req, res) => {
  db.all('SELECT * FROM policies', [], (err, rows) => {
    if (err) {
      console.error('SQLite Error:', err);
      return res.status(500).json({ error: 'Could not fetch policies' });
    }
    const policies = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      rules: JSON.parse(row.rules_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    res.json(policies);
  });
});

// READ by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM policies WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('SQLite Error:', err);
      return res.status(500).json({ error: 'Could not fetch policy' });
    }
    if (!row) return res.status(404).json({ error: 'Policy not found' });

    res.json({
      id: row.id,
      name: row.name,
      description: row.description,
      rules: JSON.parse(row.rules_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  });
});

// UPDATE
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, description = '', rules = [] } = req.body;

  if (!name || !Array.isArray(rules)) {
    return res.status(400).json({ error: 'name and rules[] are required' });
  }

  const now = new Date().toISOString();
  const stmt = `
    UPDATE policies
    SET name = ?, description = ?, rules_json = ?, updated_at = ?
    WHERE id = ?
  `;

  db.run(stmt, [name, description, JSON.stringify(rules), now, id], function (err) {
    if (err) {
      console.error('SQLite Error:', err);
      return res.status(500).json({ error: 'Could not update policy' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Policy not found' });

    res.json({ message: 'Policy updated', id });
  });
});

// DELETE
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM policies WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('SQLite Error:', err);
      return res.status(500).json({ error: 'Could not delete policy' });
    }
    if (this.changes === 0) return res.status(404).json({ error: 'Policy not found' });

    res.json({ message: 'Policy deleted', id });
  });
});

module.exports = router;
