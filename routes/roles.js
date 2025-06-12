const express = require('express');
const db = require('../database/db');
const router = express.Router();

router.post('/', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Role name is required' });
    }

    const stmt = db.prepare('INSERT INTO roles (name) VALUES (?)');
    stmt.run(name, function (err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ error: 'Role already exists' });
            }
            return res.status(500).json({ error: 'Failed to create role' });
        }

        res.status(201).json({ id: this.lastID });
    });
});

router.get('/', (req, res) => {
    db.all(`SELECT id, name FROM roles`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch roles' });
        }

        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
    const { id } = req.params;

    db.get(`SELECT id, name FROM roles WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch role' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Role not found' });
        }

        res.json(row);
    });
});


router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM roles WHERE id = ?`, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'DB error while deleting role' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Role not found' });
        }

        res.json({ message: 'Role deleted', roleId: id });
    });
});



module.exports = router;
