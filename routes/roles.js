const express = require('express');
const router = express.Router();
const {Role} = require('../models');

// Create a role
router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Role name is required' });
  }

  try {
    const role = await Role.create({ name });
    res.status(201).json({ id: role.id });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Role already exists' });
    }
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// Get all roles
router.get('/', async (req, res) => {
  try {
    const roles = await Role.findAll({ attributes: ['id', 'name'] });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get role by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const role = await Role.findByPk(id, { attributes: ['id', 'name'] });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// Delete role by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Role.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ message: 'Role deleted', roleId: id });
  } catch (err) {
    res.status(500).json({ error: 'DB error while deleting role' });
  }
});

module.exports = router;
