const {UserAttributes} = require("../models");

async function getAttributes(userId) {
  const row = await UserAttributes.findOne({ where: { user_id: userId } });

  if (!row) {
    throw new Error('Attributes not found');
  }

  return { userId, ...row.toJSON() };
}

async function getAttributesSafely(userId) {
  try {
    return await getAttributes(userId);
  } catch (err) {
    return {};
  }
}

module.exports = { getAttributes, getAttributesSafely };
