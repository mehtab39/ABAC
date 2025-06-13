const express = require('express');
const router = express.Router();
const {Policy} = require('../models');

// CREATE
router.post('/', async (req, res) => {
  const { id, name, description = '', rules = [] } = req.body;
  if (!id || !name || !Array.isArray(rules)) {
    return res.status(400).json({ error: 'id, name, and rules[] are required' });
  }

  const now = new Date().toISOString();

  try {
    await Policy.create({
      id,
      name,
      description,
      rules_json: JSON.stringify(rules),
      created_at: now,
      updated_at: now
    });

    res.status(201).json({ message: 'Policy created', id });
  } catch (err) {
    console.error('Sequelize Error:', err);
    res.status(500).json({ error: 'Could not store policy' });
  }
});

// READ ALL
router.get('/', async (req, res) => {
  try {
    const policies = await Policy.findAll();

    res.json(policies.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      rules: JSON.parse(row.rules_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
  } catch (err) {
    console.error('Sequelize Error:', err);
    res.status(500).json({ error: 'Could not fetch policies' });
  }
});

// READ BY ID
router.get('/:id', async (req, res) => {
  try {
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) return res.status(404).json({ error: 'Policy not found' });

    res.json({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      rules: JSON.parse(policy.rules_json),
      createdAt: policy.created_at,
      updatedAt: policy.updated_at,
    });
  } catch (err) {
    console.error('Sequelize Error:', err);
    res.status(500).json({ error: 'Could not fetch policy' });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  const { name, description = '', rules = [] } = req.body;

  if (!name || !Array.isArray(rules)) {
    return res.status(400).json({ error: 'name and rules[] are required' });
  }

  try {
    const updated = await Policy.update(
      {
        name,
        description,
        rules_json: JSON.stringify(rules),
        updated_at: new Date().toISOString()
      },
      { where: { id: req.params.id } }
    );

    if (updated[0] === 0) return res.status(404).json({ error: 'Policy not found' });

    res.json({ message: 'Policy updated', id: req.params.id });
  } catch (err) {
    console.error('Sequelize Error:', err);
    res.status(500).json({ error: 'Could not update policy' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Policy.destroy({ where: { id: req.params.id } });

    if (!deleted) return res.status(404).json({ error: 'Policy not found' });

    res.json({ message: 'Policy deleted', id: req.params.id });
  } catch (err) {
    console.error('Sequelize Error:', err);
    res.status(500).json({ error: 'Could not delete policy' });
  }
});

module.exports = router;
