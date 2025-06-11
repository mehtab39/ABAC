const express = require('express');
const router = express.Router();
const ddbDocClient = require('../utils/dynamoClient');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

router.post('/', async (req, res) => {
  const { entity, action, description } = req.body;
  if (!entity || !action) {
    return res.status(400).json({ error: 'Entity and action required' });
  }

  const key = `${entity}.${action}`;
  try {
    await ddbDocClient.send(new PutCommand({
      TableName: process.env.PERMSSION_TABLE_NAME,
      Item: { key, entity, action, description: description || "" }
    }));
    res.status(201).json({ key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DynamoDB error' });
  }
});

module.exports = router;
