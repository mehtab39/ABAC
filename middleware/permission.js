const { defineAbilityFor } = require("../casl/defineAbility");
const {getPermissionsForUser}  = require('../services/permissions')

async function permissionHandler(req, res, next) {
    try{
        const user = req.userContext;
        const permissions = await getPermissionsForUser(user);
        req.userContext.ability = defineAbilityFor(permissions);
        next()
    }catch(err){
        console.error('Failed to fetch user policy context:', err);
        res.sendStatus(500);
    }

}

module.exports = permissionHandler;
