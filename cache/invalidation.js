const redisClient = require('./redis');

async function invalidatePolicyCache(policyId) {
  await redisClient.del(`policy:${policyId}`);
}

async function invalidatePermissionsForRole(roleId) {
  await redisClient.del(`role:${roleId}:policyIds`);
}

async function invalidatePermissionKey(permissionKey) {
  await redisClient.del(`permission:${permissionKey}`);
}

module.exports = {
  invalidatePolicyCache,
  invalidatePermissionsForRole,
  invalidatePermissionKey,
};

