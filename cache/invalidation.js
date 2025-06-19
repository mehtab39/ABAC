const redisClient = require('./redis');


async function invalidatePolicyCache(policyId) {
  if (!policyId) return;
  try {
    await redisClient.del(`policy:${policyId}`);
  } catch (err) {
    console.error(`Failed to invalidate policy cache for ${policyId}:`, err);
  }
}


/**
 * Invalidate all permissions derived from a user’s policies
 * @param {number|string} userId
 */
async function invalidatePermissionsForUser(userId) {
  if (!userId) return;
  try {
    await redisClient.del(`user:${userId}:policyIds`);
  } catch (err) {
    console.error(`Failed to invalidate user permission cache for ${userId}:`, err);
  }
}

/**
 * Invalidate a specific permission by key
 * @param {string} permissionKey
 */
async function invalidatePermissionKey(permissionKey) {
  if (!permissionKey) return;
  try {
    await redisClient.del(`permission:${permissionKey}`);
  } catch (err) {
    console.error(`Failed to invalidate permission key ${permissionKey}:`, err);
  }
}

module.exports = {
  invalidatePolicyCache,
  invalidatePermissionsForUser,
  invalidatePermissionKey,
};
