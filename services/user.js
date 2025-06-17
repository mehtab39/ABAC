const { User} = require("../models");

async function  getRoleIdFromUserId(userId) {
  const user = await User.findOne({ where: { id: userId } });
  if(!user){
     throw new Error('user not found');
  }
  return user.roleId;
}

module.exports = { getRoleIdFromUserId };
