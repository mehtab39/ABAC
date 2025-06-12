const express = require('express');
const {
    PutCommand,
    GetCommand,
    DeleteCommand,
    ScanCommand,
    UpdateCommand
} = require('@aws-sdk/lib-dynamodb');
const router = express.Router();
const ddbDocClient = require('../utils/dynamoClient');

const TABLE_NAME = process.env.POLICY_TABLE_NAME;

// CREATE a policy
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
            TableName: TABLE_NAME,
            Item: item
        }));

        res.status(201).json({ message: 'Policy created', id });
    } catch (err) {
        console.error('DynamoDB Error:', err);
        res.status(500).json({ error: 'Could not store policy' });
    }
});

// GET all policies
router.get('/', async (req, res) => {
    try {
        const data = await ddbDocClient.send(new ScanCommand({ TableName: TABLE_NAME }));
        res.status(200).json(data.Items || []);
    } catch (err) {
        console.error('DynamoDB Error:', err);
        res.status(500).json({ error: 'Could not fetch policies' });
    }
});

// GET a specific policy by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const data = await ddbDocClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { id }
        }));

        if (!data.Item) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        res.status(200).json(data.Item);
    } catch (err) {
        console.error('DynamoDB Error:', err);
        res.status(500).json({ error: 'Could not fetch policy' });
    }
});

// UPDATE a policy
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description = '', rules = [] } = req.body;

    if (!name || !Array.isArray(rules)) {
        return res.status(400).json({ error: 'name and rules[] are required' });
    }

    const now = new Date().toISOString();

    try {
        await ddbDocClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: 'SET #name = :name, description = :desc, #rules = :rules, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#name': 'name',
                '#rules': 'rules' // Alias 'rules' to avoid reserved keyword error
            },
            ExpressionAttributeValues: {
                ':name': name,
                ':desc': description,
                ':rules': rules,
                ':updatedAt': now
            }
        }));


        res.status(200).json({ message: 'Policy updated', id });
    } catch (err) {
        console.error('DynamoDB Error:', err);
        res.status(500).json({ error: 'Could not update policy' });
    }
});

// DELETE a policy
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await ddbDocClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id }
        }));

        res.status(200).json({ message: 'Policy deleted', id });
    } catch (err) {
        console.error('DynamoDB Error:', err);
        res.status(500).json({ error: 'Could not delete policy' });
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
//    permissionKey?: string;

//     /**
//      * Mongo-like query conditions for ABAC-style permissions.
//      * Supports operators like $in, $and, $or, etc.
//      * Placeholders like ${user.region} may be substituted at runtime.
//      */
//     conditions?: Record<string, Condition>;

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
