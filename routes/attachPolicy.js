const express = require('express');
const router = express.Router();
const { PolicyAssignment } = require('../models');
const { invalidatePermissionsForUser } = require('../cache/invalidation');


router.post('/', async (req, res) => {
  const { userId, policyId } = req.body;

  if (!policyId || !userId) {
    return res.status(400).json({ error: 'policyId and userId are required' });
  }

  try {
    const [entry, created] = await PolicyAssignment.findOrCreate({
      where: { policy_id: policyId, user_id: userId || null }
    });

    if (!created) {
      return res.status(409).json({ error: 'Policy assignment already exists' });
    }

    await invalidatePermissionsForUser(userId);

    res.status(201).json({ message: 'Policy assigned', id: entry.id });
  } catch (err) {
    console.error('Sequelize Error:', err);
    res.status(500).json({ error: 'Failed to assign policy' });
  }
});

router.delete('/', async (req, res) => {
  const { userId, policyId } = req.body;

  if (!policyId || !userId) {
    return res.status(400).json({ error: 'policyId and userId are required' });
  }

  try {
    const deleted = await PolicyAssignment.destroy({
      where: {
        policy_id: policyId,
        user_id: userId || null
      }
    });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await invalidatePermissionsForUser(userId);

    res.json({ message: 'Policy unassigned' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unassign policy' });
  }
});

// Get all policy assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await PolicyAssignment.findAll({
      attributes: ['id', 'policy_id', 'user_id', 'assigned_at']
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch policy assignments' });
  }
});


// Get all policy IDs for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const entries = await PolicyAssignment.findAll({
      where: { user_id: req.params.userId },
      attributes: ['policy_id']
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch policies for user' });
  }
});


router.get('/policy/:policyId', async (req, res) => {
  try {
    const entries = await PolicyAssignment.findAll({
      where: { policy_id: req.params.policyId },
      attributes: ['user_id']
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments for policy' });
  }
});

module.exports = router;
