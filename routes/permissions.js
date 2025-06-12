const express = require('express');
const router = express.Router();
const ddbDocClient = require('../utils/dynamoClient');
const { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.PERMSSION_TABLE_NAME;

// Create a permission
router.post('/', async (req, res) => {
  const { entity, action, description } = req.body;
  if (!entity || !action) {
    return res.status(400).json({ error: 'Entity and action required' });
  }

  const key = `${entity}.${action}`;
  try {
    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { key, entity, action, description: description || "" }
    }));
    res.status(201).json({ key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DynamoDB error' });
  }
});

// List all permissions
router.get('/', async (req, res) => {
  try {
    const data = await ddbDocClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    res.status(200).json(data.Items || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DynamoDB scan error' });
  }
});

// Get a permission by key
router.get('/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const data = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { key }
    }));
    if (!data.Item) {
      return res.status(404).json({ error: 'Permission not found' });
    }
    res.status(200).json(data.Item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DynamoDB get error' });
  }
});

// Update a permission by key
router.put('/:key', async (req, res) => {
  const { key } = req.params;
  const { description } = req.body;

  if (typeof description !== 'string') {
    return res.status(400).json({ error: 'Description must be a string' });
  }

  try {
    await ddbDocClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { key },
      UpdateExpression: 'SET description = :desc',
      ExpressionAttributeValues: { ':desc': description },
    }));
    res.status(200).json({ message: 'Permission updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DynamoDB update error' });
  }
});

// Delete a permission by key
router.delete('/:key', async (req, res) => {
  const { key } = req.params;
  try {
    await ddbDocClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { key }
    }));
    res.status(200).json({ message: 'Permission deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DynamoDB delete error' });
  }
});

module.exports = router;
