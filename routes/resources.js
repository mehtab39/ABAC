const express = require('express');
const db = require('../database/db');
const router = express.Router();

router.post('/', (req, res) => {
    const { name, description } = req.body;

    // if (!req.userContext.ability.can('update', { __type: 'Order', region: 'Rajasthan' })) {
    //     return res.status(403).json({ error: 'You are not allowed bro!' });
    // }


    if (!name) {
        return res.status(400).json({ error: 'Resource name is required' });
    }

    db.run(
        `INSERT INTO resources (name, description) VALUES (?, ?)`,
        [name, description || ''],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ error: 'Resource already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }


            res.status(201).json({ id: this.lastID, name, description });
        }
    );
});



// GET all resources
router.get('/', (req, res) => {
    db.all(`SELECT * FROM resources ORDER BY id ASC`, [], (err, rows) => {
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// GET single resource by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;

    db.get(`SELECT * FROM resources WHERE id = ?`, [id], (err, row) => {
        if (!req.userContext.ability.can('view', { __type: 'Commodity', ...row })) {
            return res.status(403).json({ error: 'You are not allowed bro!' });
        }
        if (err) {
            console.error('DB error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        res.json(row);
    });
});

module.exports = router;
