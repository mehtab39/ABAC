const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { BatchGetCommand } = require('@aws-sdk/lib-dynamodb');
const ddbDocClient = require('../utils/dynamoClient');
const { defineAbilityFor } = require('../casl/defineAbility');

const redisClient = require('../cache/redis');
const { getAttributes } = require('../services/user');

async function getPoliciesForRoleCached(roleId) {
    const cacheKey = `role:${roleId}:policies`;

    const cached = await redisClient.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    const policyKeys = await getPoliciesForRole(roleId);
    const policies = await getPolicyDetails(policyKeys);

    // Store in Redis for 10 minutes
    await redisClient.set(cacheKey, JSON.stringify(policies), { EX: 600 });

    return policies;
}



async function getPoliciesForRole(roleId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT policy_id FROM role_policies WHERE role_id = ?`,
            [roleId],
            (err, rows) => {
                if (err) return reject(err);
                const policyIds = rows.map(row => row.policy_id);
                resolve(policyIds);
            }
        );
    });
}

async function getPolicyDetails(policyIds) {
    const keys = policyIds.map(id => ({ id }));
    const result = await ddbDocClient.send(
        new BatchGetCommand({
            RequestItems: {
                [process.env.POLICY_TABLE_NAME]: {
                    Keys: keys
                }
            }
        })
    );

    const policies = result.Responses?.[process.env.POLICY_TABLE_NAME] || [];

    const permissionKeys = new Set();
    for (const policy of policies) {
        for (const rule of policy.rules || []) {
            if (rule.permissionKey) {
                permissionKeys.add(rule.permissionKey);
            }
        }
    }

    const permissionResult = await ddbDocClient.send(
        new BatchGetCommand({
            RequestItems: {
                [process.env.PERMSSION_TABLE_NAME]: {
                    Keys: [...permissionKeys].map(key => ({ key }))
                }
            }
        })
    );

    const permissions = permissionResult.Responses?.[process.env.PERMSSION_TABLE_NAME] || [];
    const permissionMap = Object.fromEntries(permissions.map(p => [p.key, p]));

    const resolvedPolicies = policies.map(policy => ({
        ...policy,
        rules: (policy.rules || []).map(rule => {
            const perm = permissionMap[rule.permissionKey];
            if (!perm) {
                console.warn(`Permission not found for key: ${rule.permissionKey}`);
                return null;
            }
            return {
                action: perm.action,
                subject: perm.entity,
                conditions: rule.conditions,
                inverted: rule.inverted,
                reason: rule.reason
            };
        }).filter(Boolean)
    }));

    return resolvedPolicies;
}

async function attachUserContext(user) {
    const roleId = user.role_id;
    const policies = await getPoliciesForRoleCached(roleId);
    const userAttributes = await getAttributes(user.id);
    const ability = defineAbilityFor(policies, { user: userAttributes, env: {
        time: new Date().toISOString()
    } });

    return {
        id: user.id,
        username: user.username,
        roleId,
        ability
    };
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);

        try {
            const context = await attachUserContext(user);
            req.userContext = context;
            next();
        } catch (e) {
            console.error('Failed to fetch user policy context:', e);
            res.sendStatus(500);
        }
    });
}

module.exports = authenticateToken;
