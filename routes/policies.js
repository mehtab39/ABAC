const express = require('express');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const router = express.Router();
const ddbDocClient = require('../utils/dynamoClient');



router.post('/', async (req, res) => {
  const { id, name, description = '', rules = [] } = req.body;

  if (!id || !name || !Array.isArray(rules)) {
    return res.status(400).json({ error: 'id, name, and rules[] are required' });
  }

  const now = new Date().toISOString();
  const item = {
    id,
    name,
    description,
    rules,
    createdAt: now,
    updatedAt: now
  };

  try {
    await ddbDocClient.send(new PutCommand({
      TableName: process.env.POLICY_TABLE_NAME,
      Item: item
    }));

    res.status(201).json({ message: 'Policy created', id });
  } catch (err) {
    console.error('DynamoDB Error:', err);
    res.status(500).json({ error: 'Could not store policy' });
  }
});

module.exports = router;




// type Primitive = string | number | boolean | null

// type ComparisonOperator = {
//   $eq?: Primitive
//   $ne?: Primitive
//   $gt?: number
//   $gte?: number
//   $lt?: number
//   $lte?: number
//   $in?: Primitive[]
//   $nin?: Primitive[]
//   $exists?: boolean
//   $all?: Primitive[]
// }

// type ConditionValue = Primitive | ComparisonOperator

// type FieldConditions = {
//   [field: string]: ConditionValue | Condition
// }

// export type Condition = FieldConditions & {
//   $and?: Condition[]
//   $or?: Condition[]
//   $nor?: Condition[]
// }


// export interface PolicyRule {
//     /** The action the rule applies to (e.g., "create", "read", "delete") */
//     action: string | string[];
  
//     /** The subject the rule applies to (e.g., "Order", "User") */
//     subject: string;
  
//     /**
//      * Mongo-like query conditions for ABAC-style permissions.
//      * Supports operators like $in, $and, $or, etc.
//      * Placeholders like ${user.region} may be substituted at runtime.
//      */
//     conditions?: Record<string, any>;
  
//     /** Whether this rule is an inverted (deny) rule */
//     inverted?: boolean;
  
//     /** Optional reason to show in UI when rule is denied */
//     reason?: string;
//   }
  
//   export interface Policy {
//     /** Unique identifier for the policy */
//     id: string;
  
//     /** Human-readable name of the policy */
//     name: string;
  
//     /** Optional description to explain policy purpose */
//     description?: string;
  
//     /** CASL-compatible array of permission rules */
//     rules: PolicyRule[];
  
//     /** ISO timestamp of policy creation */
//     createdAt: string;
  
//     /** ISO timestamp of policy last update */
//     updatedAt: string;
//   }
  