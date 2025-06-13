const redisClient = require('../cache/redis');
const { Op } = require('sequelize');
const {Permission, Policy, RolePolicy} = require('../models');
const { getAttributesSafely } = require('./user');
const utils = require('../utils');

async function getPolicies(roleId) {
    return await getPoliciesForRoleCached(roleId);
}

async function getPoliciesForRoleCached(roleId) {
    const cacheKey = `role:${roleId}:policyIds`;
    const cached = await redisClient.get(cacheKey);
    let policyIds;

    if (cached) {
        policyIds = JSON.parse(cached);
    } else {
        const records = await RolePolicy.findAll({ where: { role_id: roleId } });
        policyIds = records.map(r => r.policy_id);
        await redisClient.set(cacheKey, JSON.stringify(policyIds), { EX: 600 });
    }

    return await getPolicyDetails(policyIds);
}

async function getPolicyDetails(policyIds) {
    const policyCacheKeys = policyIds.map(id => `policy:${id}`);
    const cachedPolicies = policyIds.length ? await redisClient.mGet(policyCacheKeys) : [];

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

async function fetchPoliciesFromDB(policyIds) {
    if (!policyIds.length) return [];
    const rows = await Policy.findAll({
        where: { id: { [Op.in]: policyIds } }
    });

    return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        rules: JSON.parse(row.rules_json),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
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
        const freshPerms = await fetchPermissionsFromDB(missingKeys);

        await Promise.all(
            freshPerms.map(p =>
                redisClient.set(`permission:${p.key}`, JSON.stringify(p), { EX: 600 })
            )
        );

        freshPerms.forEach(p => result[p.key] = p);
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
            inverted: rule.inverted,
        }))
    );
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
