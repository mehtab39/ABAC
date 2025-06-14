// routes/auth.js (Sequelize version)
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const attachPermissions = require('../middleware/permission')
const { getPermissionsForUser } = require('../services/permissions')
const { User, Role, UserAttribute } = require('../models');
const { toSequelizeQuery } = require('../casl/toSequilizeQuery');

// Register
router.post('/register', async (req, res) => {
    const { username, password, roleId } = req.body;
    try {
        if (roleId) {
            const role = await Role.findByPk(roleId);
            if (!role) return res.status(400).json({ error: 'Invalid roleId' });
        }
        const user = await User.create({ username, password, roleId });
        res.status(201).json({ id: user.id, username: user.username, roleId: user.roleId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'User already exists or DB error' });
    }
});

// Delete user
router.delete('/:id', authenticateToken, attachPermissions, async (req, res) => {
    const { id } = req.params;
    const canDelete = req.userContext.ability.can('delete', { __type: 'user', id });
    if (!canDelete) return res.status(403).json({ error: 'Not allowed to delete' });

    const deleted = await User.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted', userId: id });
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role_id: user.roleId }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
    res.json({ token });
});

// Update user role
router.put('/:id/role', authenticateToken, attachPermissions, async (req, res) => {
    const { id } = req.params;
    const { roleId } = req.body;
    if (!roleId) return res.status(400).json({ error: 'roleId required' });

    const role = await Role.findByPk(roleId);
    if (!role) return res.status(400).json({ error: 'Invalid roleId' });

    const [updated] = await User.update({ roleId }, { where: { id } });
    if (!updated) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Role updated', userId: id, roleId });
});

// Upsert user attributes
router.post('/:id/attributes', authenticateToken, attachPermissions, async (req, res) => {
    const { region, department } = req.body;
    const { id: userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const canUpdateUser = req.userContext.ability.can('update', { __type: 'user', ...user.toJSON(), id: String(user.id) });
    if (!canUpdateUser) return res.status(403).json({ error: 'Not allowed to update user' });

    await UserAttribute.upsert({ user_id: userId, region, department });
    res.json({ message: 'Attributes saved', userId, region, department });
});

// Get user attributes
router.get('/:id/attributes', authenticateToken, attachPermissions, async (req, res) => {
    try {
        const { id: userId } = req.params;
        const attributes = await UserAttribute.findOne({ where: { user_id: userId } });
        if (!attributes) return res.status(404).json({ error: 'Attributes not found' });
        res.json(attributes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get permissions
router.get('/permissions', authenticateToken, async (req, res) => {
    const user = req.userContext;
    const permissions = await getPermissionsForUser(user);
    return res.json({
        permissions: permissions,
        userId: user.id,
    });
});

// Get all users
router.get('/all-users', authenticateToken, attachPermissions, async (req, res) => {
    try {
        const query = toSequelizeQuery(req.userContext.ability, 'users.list', 'read')

        const users = await User.findAll({
            attributes: ['id', 'username', 'password', 'roleId'],
            where: query, 
            include: [
              {
                model: UserAttribute,
                as: 'attributes',
                required: false, 
                attributes: ['department', 'region'],
              },
            ],
          });
          

      
        res.json(users);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
