const {UserAttribute, User} = require("../models");

async function getAttributes(userId) {

  const row = await UserAttribute.findOne({ where: { user_id: userId } }) ;

  return { userId, ...row?.toJSON() };
}

async function getAttributesSafely(userId) {
  try {
    const response =  await getAttributes(userId);
    return response;
  } catch (err) {
    console.log('[error fetching user attributes]', err)
    return {};
  }
}

async function  getRoleIdFromUserId(userId) {
  const user = await User.findOne({ where: { id: userId } });
  if(!user){
     throw new Error('user not found');
  }
  return user.roleId;
}

module.exports = { getAttributes, getAttributesSafely, getRoleIdFromUserId };
