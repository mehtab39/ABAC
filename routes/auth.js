// routes/auth.js (Sequelize version)
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const attachPermissions = require('../middleware/permission')
const { getPermissionsForUser, getRules } = require('../services/permissions')
const { User } = require('../models');
const { getRoleIdFromUserId } = require('../services/user');

// Get permissions
router.get('/permissions', authenticateToken, async (req, res) => {
    const user = req.userContext;
    const permissions = await getPermissionsForUser(user);
    return res.json({
        permissions: permissions,
        userId: user.id,
    });
});


// Get rules
router.get('/rules', authenticateToken, async (req, res) => {

    try {
        const userId = req.query.user_id;

        let roleId = req.query.role_id;

        if (userId === undefined && roleId === undefined) {
            return res.status(401).json({ error: 'Either user id or role id is necessary' });
        }



        if (roleId === undefined) {
            roleId = await getRoleIdFromUserId(userId);
        }


        if (!roleId) {
            return res.status(401).json({ error: 'Role not found' });
        }

        const rules = await getRules(userId, roleId);

        return res.json({
            rules: rules,
            userId: userId,
            roleId: roleId
        });
    } catch (err) {
        return res.status(500).json({ message: 'something went wrong' });
    }


});
// Get all users
router.get('/all-users', authenticateToken, attachPermissions, async (req, res) => {
    try {
        // const ability = req.userContext.ability;
        // const hasAccess = ability.can('read', 'users.list');

        // if(!hasAccess){
        //      return res.status(403).json({ error: 'Not allowed to view user list' });
        // }

        // const query = toSequelizeQuery(ability,  'read', 'users.list');

        const users = await User.findAll({
            attributes: ['id', 'username', 'roleId'],
           // where: query,
        });



        res.json(users);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
