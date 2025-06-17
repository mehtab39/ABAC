const express = require('express');
const router = express.Router();
const {Role} = require('../models');

// Get all roles
router.get('/', async (req, res) => {
  try {
    const roles = await Role.findAll({ attributes: ['id', 'name'] });
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});



module.exports = router;
