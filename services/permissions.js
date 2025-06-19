const redisClient = require('../cache/redis');
const { Op } = require('sequelize');
const { Permission, Policy, PolicyAssignment } = require('../models');
const utils = require('../utils');

async function getPoliciesForUserContext({ userId }) {
  const userPolicyIds = userId ? await getPolicyIdsCached({ userId }) : [];

  const allPolicyIds = [...new Set([...userPolicyIds])];
  return await getPolicyDetails(allPolicyIds);
}

async function getPolicyIdsCached({ userId }) {
  const cacheKey = `user:${userId}:policyIds`;
  let policyIds;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    policyIds = JSON.parse(cached);
  } else {
    const whereClause =  {user_id: userId }
    const records = await PolicyAssignment.findAll({ where: whereClause });
    policyIds = records.map(r => r.policy_id);

    await redisClient.set(cacheKey, JSON.stringify(policyIds), { EX: 600 });
  }

  return policyIds;
}

async function getPolicyDetails(policyIds) {
  if (!policyIds || !policyIds.length) return { permissionMap: {}, allPolicies: [] };

  const policyCacheKeys = policyIds.map(id => `policy:${id}`);
  const cachedPolicies = await redisClient.mGet(policyCacheKeys);

  const resultPolicies = [];
  const missingPolicyIds = [];

  cachedPolicies.forEach((data, i) => {
    if (data) resultPolicies.push(JSON.parse(data));
    else missingPolicyIds.push(policyIds[i]);
  });

  const freshPolicies = await fetchPoliciesFromDB(missingPolicyIds);

  await Promise.all(
    freshPolicies.map(p =>
      redisClient.set(`policy:${p.id}`, JSON.stringify(p), { EX: 600 })
    )
  );

  const allPolicies = [...resultPolicies, ...freshPolicies];

  const permissionKeys = new Set();
  allPolicies.forEach(policy => {
    (policy.rules || []).forEach(rule => {
      if (rule.permissionKey) permissionKeys.add(rule.permissionKey);
    });
  });

  const permissionMap = await getPermissionMap([...permissionKeys]);

  return { permissionMap, allPolicies };
}

async function fetchPoliciesFromDB(policyIds) {
  if (!policyIds.length) return [];

  const rows = await Policy.findAll({
    where: { id: { [Op.in]: policyIds } }
  });

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    rules: JSON.parse(row.rules_json || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function getPermissionMap(keys) {
  if (!keys.length) return {};

  const redisKeys = keys.map(k => `permission:${k}`);
  const cached = await redisClient.mGet(redisKeys);
  const result = {};
  const missingKeys = [];

  cached.forEach((val, i) => {
    const key = keys[i];
    if (val) result[key] = JSON.parse(val);
    else missingKeys.push(key);
  });

  if (missingKeys.length) {
    const freshPerms = await fetchPermissionsFromDB(missingKeys);

    await Promise.all(
      freshPerms.map(p =>
        redisClient.set(`permission:${p.key}`, JSON.stringify(p), { EX: 600 })
      )
    );

    freshPerms.forEach(p => {
      result[p.key] = p;
    });
  }

  return result;
}

async function fetchPermissionsFromDB(keys) {
  if (!keys.length) return [];
  return await Permission.findAll({
    where: { key: { [Op.in]: keys } }
  });
}

function transformPolicesToCASLLikePermissions(policies, attributes) {
  return policies.flatMap(policy =>
    (policy.rules || []).map(rule => ({
      action: rule.action,
      subject: rule.subject,
      conditions: utils.interpolate(rule.conditions, attributes),
      inverse: rule.inverse || false, 
    }))
  );
}

async function getPermissionsForUser(user) {
  const { permissionMap, allPolicies } = await getPoliciesForUserContext({
    userId: user.id,
  });

  const policies = allPolicies.map(policy => ({
    ...policy,
    rules: (policy.rules || []).map(rule => {
      const perm = permissionMap[rule.permissionKey];
      if (!perm) return null;
      return {
        action: perm.action,
        subject: perm.entity,
        conditions: rule.conditions,
        reason: rule.reason,
        inverse: rule.inverse || false,
      };
    }).filter(Boolean),
  }));

  return transformPolicesToCASLLikePermissions(policies, {
    user: user,
    env: { time: new Date().toISOString() },
  });
}

async function getRules(userId) {
  const { permissionMap, allPolicies } = await getPoliciesForUserContext({ userId });

  return allPolicies.flatMap(policy =>
    (policy.rules || []).flatMap(rule => {
      const perm = permissionMap[rule.permissionKey];
      return perm ? [perm] : [];
    })
  );
}

module.exports = {
  getPoliciesForUserContext,
  getRules,
  transformPolicesToCASLLikePermissions,
  getPermissionsForUser,
};
