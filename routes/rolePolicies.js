const express = require('express');
const router = express.Router();
const {RolePolicy} = require('../models');
const { invalidatePermissionsForRole } = require('../cache/invalidation');

// Attach policy to role
router.post('/', async (req, res) => {
  const { roleId, policyId } = req.body;

  if (!roleId || !policyId) {
    return res.status(400).json({ error: 'roleId and policyId are required' });
  }

  try {
    const [entry, created] = await RolePolicy.findOrCreate({
      where: { role_id: roleId, policy_id: policyId }
    });

    if (!created) {
      return res.status(409).json({ error: 'Role-policy pair already exists' });
    }

    await invalidatePermissionsForRole(roleId);

    res.status(201).json({ message: 'Policy attached to role', id: entry.id });
  } catch (err) {
    console.error('Sequelize Error:', err);
    res.status(500).json({ error: 'Failed to attach policy to role' });
  }
});

// Get all policy IDs attached to a role
router.get('/role/:roleId', async (req, res) => {
  const { roleId } = req.params;

  try {
    const entries = await RolePolicy.findAll({
      where: { role_id: roleId },
      attributes: ['policy_id']
    });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch policies for role' });
  }
});

// Get all role IDs that have a specific policy
router.get('/policy/:policyId', async (req, res) => {
  const { policyId } = req.params;

  try {
    const entries = await RolePolicy.findAll({
      where: { policy_id: policyId },
      attributes: ['role_id']
    });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roles for policy' });
  }
});

// Detach policy from role
router.delete('/', async (req, res) => {
  const { roleId, policyId } = req.body;

  if (!roleId || !policyId) {
    return res.status(400).json({ error: 'roleId and policyId are required' });
  }

  try {
    const deleted = await RolePolicy.destroy({
      where: { role_id: roleId, policy_id: policyId }
    });

   
    if (deleted === 0) {
      return res.status(404).json({ error: 'Role-policy pair not found' });
    }
    await invalidatePermissionsForRole(roleId);

    res.json({ message: 'Policy detached from role' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to detach policy from role' });
  }
});

// Get all role-policy mappings
router.get('/', async (req, res) => {
  try {
    const mappings = await RolePolicy.findAll({
      attributes: ['role_id', 'policy_id']
    });

    res.json(mappings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch role-policy mappings' });
  }
});

module.exports = router;
