const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { getAttributes } = require('../services/user');
const router = express.Router();
const authenticateToken = require('../middleware/auth');

router.post('/register', async (req, res) => {
    const { username, password, roleId } = req.body;

    if (roleId) {
        db.get(`SELECT id FROM roles WHERE id = ?`, [roleId], (err, role) => {
            if (err || !role) {
                return res.status(400).json({ error: 'Invalid roleId' });
            }
            createUser(username, password, roleId, res);
        });
    } else {
        createUser(username, password, null, res);
    }
});

router.delete('/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    const canDelete = req.userContext.ability.can('delete', { __type: 'user', id });

    if(!canDelete){
        return res.status(403).json({ error: 'Not allowed to delete' });
    }

    

    db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'DB error while deleting user' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted', userId: id });
    });
});



function createUser(username, password, roleId, res) {
    db.run(
        `INSERT INTO users(username, password, role_id) VALUES(?, ?, ?)`,
        [username, password, roleId],
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

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (password !== user.password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    });
});



router.put('/:id/role', authenticateToken, (req, res) => {
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
router.post('/:id/attributes', authenticateToken, (req, res) => {
    const { region, department } = req.body;
    const { id: userId } = req.params;

    db.get(`SELECT id FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const canUpdateUser = req.userContext.ability.can('update', { __type: 'user', ...user, id: String(user.id) });

        if (!canUpdateUser) {
            return res.status(403).json({ error: 'Not allowed to update user' });
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



// GET /auth/:id/attributes
router.get('/:id/attributes', authenticateToken, async (req, res) => {
    try {
        const { id: userId } = req.params;

        const attributes = await getAttributes(userId);

        res.json(attributes);
    } catch (err) {
        res.status(500).json({ error: err });
    }

});


router.get('/all-users', authenticateToken, (req, res) => {
    db.all(`SELECT id, username, password, role_id FROM users`, [], (err, rows) => {

        if (err) {
            return res.status(500).json({ error: 'DB error' });
        }

        // CHALLENGE:MG MUTLIPLE CHECKS AND ALSO NOT ABLE TO FETCH ONLY ROWS REQUESTED
        const canViewAllUsers = req.userContext.ability.can('read', { __type: 'users.list' });

        if (!canViewAllUsers) {
            // CHALLENGE:MG FORCED TYPE CASTING
            rows = rows.filter((row) => req.userContext.ability.can('read', { __type: 'users.list', ...row, id: String(row.id) }))
        }

        res.json(rows)
    });
});



module.exports = router;