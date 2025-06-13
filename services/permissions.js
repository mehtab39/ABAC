
const redisClient = require('../cache/redis');
const db = require('../database/db');
const { getAttributesSafely } = require('./user');
const utils = require('../utils')

async function getPolicies(roleId) {
  return await getPoliciesForRoleCached(roleId);
}

async function getPoliciesForRoleCached(roleId) {
  const cacheKey = `role:${roleId}:policyIds`;
  const cached = await redisClient.get(cacheKey);
  let policyIds = cached ? JSON.parse(cached) : await getPoliciesForRole(roleId);
  if (!cached) {
    await redisClient.set(cacheKey, JSON.stringify(policyIds), {
      EX: 600 
    });
  }

  return await getPolicyDetails(policyIds);
}

async function getPoliciesForRole(roleId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT policy_id FROM role_policies WHERE role_id = ?`, [roleId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(row => row.policy_id));
    });
  });
}

async function getPolicyDetails(policyIds) {

  const policyCacheKeys = policyIds.map(id => `policy:${id}`);
  const cachedPolicies = policyCacheKeys.length ? await redisClient.mGet(policyCacheKeys) : [];
  const resultPolicies = [];
  const missingPolicyIds = [];

  cachedPolicies.forEach((data, i) => {
    if (data) resultPolicies.push(JSON.parse(data));
    else missingPolicyIds.push(policyIds[i]);
  });

  const freshPolicies = await fetchPoliciesFromSQLite(missingPolicyIds);

  await Promise.all(
    freshPolicies.map(p =>
      redisClient.set(`policy:${p.id}`, JSON.stringify(p), {
        EX: 600 
      })
    )
  );

  const allPolicies = [...resultPolicies, ...freshPolicies];
  const permissionKeys = new Set();
  allPolicies.forEach(policy => {
    (policy.rules || []).forEach(rule => rule.permissionKey && permissionKeys.add(rule.permissionKey));
  });

  const permissionMap = await getPermissionMap([...permissionKeys]);

  return allPolicies.map(policy => ({
    ...policy,
    rules: (policy.rules || []).map(rule => {
      const perm = permissionMap[rule.permissionKey];
      if (!perm) return null;
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

async function fetchPoliciesFromSQLite(policyIds) {
  return new Promise((resolve, reject) => {
    const placeholders = policyIds.map(() => '?').join(',');
    db.all(`SELECT * FROM policies WHERE id IN (${placeholders})`, policyIds, (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        rules: JSON.parse(row.rules_json),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })));
    });
  });
}

async function getPermissionMap(keys) {
  const redisKeys = keys.map(k => `permission:${k}`);
  const cached = keys.length ? await redisClient.mGet(redisKeys) : [];
  const result = {};
  const missingKeys = [];

  cached.forEach((val, i) => {
    const key = keys[i];
    if (val) result[key] = JSON.parse(val);
    else missingKeys.push(key);
  });

  if (missingKeys.length > 0) {
    const freshPerms = await fetchPermissionsFromSQLite(missingKeys);
    await Promise.all(
      freshPerms.map(p =>
        redisClient.set(`permission:${p.key}`, JSON.stringify(p), {
          EX: 600 
        })
      )
    );
    freshPerms.forEach(p => result[p.key] = p);
  }

  return result;
}

async function fetchPermissionsFromSQLite(keys) {
  return new Promise((resolve, reject) => {
    const placeholders = keys.map(() => '?').join(',');
    db.all(`SELECT * FROM permissions WHERE key IN (${placeholders})`, keys, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function transformPolicesToCASLLikePermissions(policies, attributes) {
    console.log('testt', JSON.stringify(policies))
  return policies.flatMap(policy => (policy.rules || []).map(rule => ({
    action: rule.action,
    subject: rule.subject,
    conditions: utils.interpolate(rule.conditions, attributes),
    inverted: rule.inverted,
  })));
}

async function getPermissionsForUser(user) {
  const policies = await getPolicies(user.role_id);
  const userAttributes = await getAttributesSafely(user.id);
  return transformPolicesToCASLLikePermissions(policies, {
    user: { ...user, ...userAttributes },
    env: { time: new Date().toISOString() },
  });
}

module.exports = {
  getPolicies,
  transformPolicesToCASLLikePermissions,
  getPermissionsForUser
};
