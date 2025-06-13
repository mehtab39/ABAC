const express = require('express');
const router = express.Router();
const { Permission } = require('../models');
const { invalidatePermissionKey } = require('../cache/invalidation');

// Create a permission
router.post('/', async (req, res) => {
    const { entity, action, description = '' } = req.body;

    if (!entity || !action) {
        return res.status(400).json({ error: 'Entity and action required' });
    }

    const key = `${entity}.${action}`;

    try {
        await Permission.create({ key, entity, action, description });
        res.status(201).json({ key });
    } catch (err) {
        console.error('Sequelize Error:', err);
        res.status(500).json({ error: 'Could not create permission' });
    }
});

// List all permissions
router.get('/', async (req, res) => {
    try {
        const permissions = await Permission.findAll();
        res.status(200).json(permissions);
    } catch (err) {
        console.error('Sequelize Error:', err);
        res.status(500).json({ error: 'Could not fetch permissions' });
    }
});

// Get a permission by key
router.get('/:key', async (req, res) => {
    try {
        const permission = await Permission.findByPk(req.params.key);
        if (!permission) return res.status(404).json({ error: 'Permission not found' });
        res.status(200).json(permission);
    } catch (err) {
        console.error('Sequelize Error:', err);
        res.status(500).json({ error: 'Could not fetch permission' });
    }
});

// Update a permission by key
router.put('/:key', async (req, res) => {
    const { description } = req.body;

    if (typeof description !== 'string') {
        return res.status(400).json({ error: 'Description must be a string' });
    }

    try {
        const [updated] = await Permission.update({ description }, { where: { key: req.params.key } });

        if (!updated) return res.status(404).json({ error: 'Permission not found' });

        await invalidatePermissionKey(req.params.key);

        res.status(200).json({ message: 'Permission updated' });
    } catch (err) {
        console.error('Sequelize Error:', err);
        res.status(500).json({ error: 'Could not update permission' });
    }
});

// Delete a permission by key
router.delete('/:key', async (req, res) => {
    try {
        const deleted = await Permission.destroy({ where: { key: req.params.key } });

        if (!deleted) return res.status(404).json({ error: 'Permission not found' });

        await invalidatePermissionKey(req.params.key);

        res.status(200).json({ message: 'Permission deleted' });
    } catch (err) {
        console.error('Sequelize Error:', err);
        res.status(500).json({ error: 'Could not delete permission' });
    }
});

module.exports = router;
