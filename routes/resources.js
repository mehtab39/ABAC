const express = require('express');
const db = require('../database/db');
const router = express.Router();

router.post('/', (req, res) => {
    const { name, description } = req.body;

    if (!req.userContext.ability.can('update', { __type: 'Order', region: 'Rajasthan' })) {
        return res.status(403).json({ error: 'You are not allowed bro!' });
    }


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

module.exports = router;
