const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password, roleId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (roleId) {
        // Validate that the role exists
        db.get(`SELECT id FROM roles WHERE id = ?`, [roleId], (err, role) => {
            if (err || !role) {
                return res.status(400).json({ error: 'Invalid roleId' });
            }

            createUser(username, hashedPassword, roleId, res);
        });
    } else {
        // No role provided
        createUser(username, hashedPassword, null, res);
    }
});

function createUser(username, hashedPassword, roleId, res) {
    db.run(
        `INSERT INTO users(username, password, role_id) VALUES(?, ?, ?)`,
        [username, hashedPassword, roleId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'User already exists or DB error' });
            }
            res.status(201).json({ id: this.lastID, username, roleId });
        }
    );
}

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username, role_id: user.role_id }, process.env.JWT_SECRET, {
            expiresIn: '1h',
        });

        res.json({ token });
    });
});


router.put('/:id/role', (req, res) => {
    const { id } = req.params;
    const { roleId } = req.body;

    if (!roleId) return res.status(400).json({ error: 'roleId required' });

    db.get(`SELECT id FROM roles WHERE id = ?`, [roleId], (err, role) => {
        if (err || !role) {
            return res.status(400).json({ error: 'Invalid roleId' });
        }

        db.run(`UPDATE users SET role_id = ? WHERE id = ?`, [roleId, id], function (err) {
            if (err) return res.status(500).json({ error: 'DB error' });
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });

            res.json({ message: 'Role updated', userId: id, roleId });
        });
    });
});


// Upsert user attributes
router.post('/:id/attributes', (req, res) => {
    const { region, department } = req.body;
    const { id: userId } = req.params;
  
    db.get(`SELECT id FROM users WHERE id = ?`, [userId], (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      db.run(`
        INSERT INTO user_attributes (user_id, region, department)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET region = excluded.region, department = excluded.department
      `, [userId, region, department], function (err) {
        if (err) {
          return res.status(500).json({ error: 'DB error' });
        }
  
        res.json({ message: 'Attributes saved', userId, region, department });
      });
    });
  });
module.exports = router;
