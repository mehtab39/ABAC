const redisClient = require('../cache/redis');
const db = require('../database/db');
const { BatchGetCommand } = require('@aws-sdk/lib-dynamodb');
const ddbDocClient = require('../utils/dynamoClient');
const interpolate = require('interpolate-object');
const chunk = require('lodash/chunk'); // for batching DynamoDB reads
const { getAttributesSafely } = require('./user');

const POLICY_TABLE = process.env.POLICY_TABLE_NAME;
const PERMISSION_TABLE = process.env.PERMSSION_TABLE_NAME;

// Entry point
async function getPolicies(roleId) {
  return await getPoliciesForRoleCached(roleId);
}

// Caches resolved policies per role
async function getPoliciesForRoleCached(roleId) {
  const cacheKey = `role:${roleId}:policyIds`;
  const cached = await redisClient.get(cacheKey);

  let policyIds;

  if (cached) {
    policyIds = JSON.parse(cached);
  } else {
    policyIds = await getPoliciesForRole(roleId);
    await redisClient.set(cacheKey, JSON.stringify(policyIds), {
      EX: 600 + Math.floor(Math.random() * 60), // 10–11 min
    });
  }

  return await getPolicyDetails(policyIds);
}

// SQL: role → policy IDs
async function getPoliciesForRole(roleId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT policy_id FROM role_policies WHERE role_id = ?`, [roleId], (err, rows) => {
      if (err) return reject(err);
      const ids = rows.map(row => row.policy_id);
      resolve(ids);
    });
  });
}

// Main resolver: policy documents + permission details
async function getPolicyDetails(policyIds) {
  const policyCacheKeys = policyIds.map(id => `policy:${id}`);
  const cachedPolicies = await redisClient.mGet(policyCacheKeys);

  const resultPolicies = [];
  const missingPolicyIds = [];

  cachedPolicies.forEach((data, i) => {
    if (data) {
      resultPolicies.push(JSON.parse(data));
    } else {
      missingPolicyIds.push(policyIds[i]);
    }
  });

  const freshPolicies = await fetchPoliciesFromDynamo(missingPolicyIds);

  // cache fresh policies
  await Promise.all(
    freshPolicies.map(p =>
      redisClient.set(`policy:${p.id}`, JSON.stringify(p), { EX: 600 + Math.floor(Math.random() * 60) })
    )
  );

  const allPolicies = [...resultPolicies, ...freshPolicies];

  // collect unique permissionKeys
  const permissionKeys = new Set();
  for (const policy of allPolicies) {
    for (const rule of policy.rules || []) {
      if (rule.permissionKey) {
        permissionKeys.add(rule.permissionKey);
      }
    }
  }

  const permissionMap = await getPermissionMap([...permissionKeys]);

  // Resolve full policies with action/subject from permission store
  return allPolicies.map(policy => ({
    ...policy,
    rules: (policy.rules || []).map(rule => {
      const perm = permissionMap[rule.permissionKey];
      if (!perm) {
        console.warn(`Missing permissionKey: ${rule.permissionKey}`);
        return null;
      }

      return {
        action: perm.action,
        subject: perm.entity,
        conditions: rule.conditions,
        inverted: rule.inverted,
        reason: rule.reason,
      };
    }).filter(Boolean),
  }));
}

// Fetch policies from DynamoDB (batched by 100)
async function fetchPoliciesFromDynamo(policyIds) {
  const chunks = chunk(policyIds, 100);
  const all = [];

  for (const group of chunks) {
    const res = await ddbDocClient.send(
      new BatchGetCommand({
        RequestItems: {
          [POLICY_TABLE]: {
            Keys: group.map(id => ({ id })),
          },
        },
      })
    );
    const batch = res.Responses?.[POLICY_TABLE] || [];
    all.push(...batch);
  }

  return all;
}

// Fetch permission entities by keys (uses Redis first, Dynamo fallback)
async function getPermissionMap(keys) {
  const redisKeys = keys.map(k => `permission:${k}`);
  const cached = await redisClient.mGet(redisKeys);

  const result = {};
  const missingKeys = [];

  cached.forEach((val, i) => {
    const key = keys[i];
    if (val) {
      result[key] = JSON.parse(val);
    } else {
      missingKeys.push(key);
    }
  });

  if (missingKeys.length > 0) {
    const freshPerms = await fetchPermissionsFromDynamo(missingKeys);

    await Promise.all(
      freshPerms.map(p =>
        redisClient.set(`permission:${p.key}`, JSON.stringify(p), { EX: 600 + Math.floor(Math.random() * 60) })
      )
    );

    for (const p of freshPerms) {
      result[p.key] = p;
    }
  }

  return result;
}

// Fetch from DynamoDB (batched)
async function fetchPermissionsFromDynamo(keys) {
  const chunks = chunk(keys, 100);
  const all = [];

  for (const group of chunks) {
    const res = await ddbDocClient.send(
      new BatchGetCommand({
        RequestItems: {
          [PERMISSION_TABLE]: {
            Keys: group.map(key => ({ key })),
          },
        },
      })
    );
    const batch = res.Responses?.[PERMISSION_TABLE] || [];
    all.push(...batch);
  }

  return all;
}

function transformPolicesToCASLLikePermissions(policies, attributes){
    const permissions = [];
    for(const policy of policies) {
        for(const rule of policy.rules || []) {
            const pattern = /\$\{(.+?)\}/g;
            const conditions = interpolate(rule.conditions, attributes, pattern);
            permissions.push({
                action: rule.action,
                subject: rule.subject,
                conditions,
                inverted: rule.inverted
            })
        }
    }
    return permissions;
}


async function getPermissionsForUser(user){
    const policies = await getPolicies(user.role_id);
    const userAttributes = await getAttributesSafely(user.id);
    return transformPolicesToCASLLikePermissions(policies, {
        user: { ...user, ...userAttributes }, env: {
            time: new Date().toISOString()
        }
    })
}

module.exports = { getPolicies, transformPolicesToCASLLikePermissions, getPermissionsForUser };
