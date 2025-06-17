// routes/auth.js (Sequelize version)
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const attachPermissions = require('../middleware/permission')
const { getPermissionsForUser, getRules } = require('../services/permissions')
const { User, Role } = require('../models');
const { getRoleIdFromUserId } = require('../services/user');

// Register
router.post('/register', async (req, res) => {
    const { username, password, roleId } = req.body;
    try {
        if (roleId) {
            const role = await Role.findByPk(roleId);
            if (!role) return res.status(400).json({ error: 'Invalid roleId' });
        }
        const user = await User.create({ username, password, roleId });
        res.status(201).json({ id: user.id, username: user.username, roleId: user.roleId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'User already exists or DB error' });
    }
});

// Delete user
router.delete('/:id', authenticateToken, attachPermissions, async (req, res) => {
    const { id } = req.params;
    // const canDelete = req.userContext.ability.can('delete', { __type: 'user', id });
    // if (!canDelete) return res.status(403).json({ error: 'Not allowed to delete' });

    const deleted = await User.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted', userId: id });
});

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role_id: user.roleId }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
    res.json({ token });
});

// Update user role
router.put('/:id/role', authenticateToken, attachPermissions, async (req, res) => {
    const { id } = req.params;
    const { roleId } = req.body;
    if (!roleId) return res.status(400).json({ error: 'roleId required' });

    const role = await Role.findByPk(roleId);
    if (!role) return res.status(400).json({ error: 'Invalid roleId' });

    const [updated] = await User.update({ roleId }, { where: { id } });
    if (!updated) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Role updated', userId: id, roleId });
});





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

    try{
        const userId =  req.query.user_id;

        let roleId = req.query.role_id;
    
        if(userId === undefined && roleId === undefined){
            return res.status(401).json({ error: 'Either user id or role id is necessary' });
        }
    
    
    
        if(roleId === undefined){
            roleId = await getRoleIdFromUserId(userId);
        }

    
        if(!roleId){
            return res.status(401).json({ error: 'Role not found' });
        }
    
    
        const rules = await getRules(userId, roleId);
    
        return res.json({
            rules: rules,
            userId: userId,
            roleId: roleId
        });
    }catch(err){
         return res.status(500).json({message: 'something went wrong'});
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
            attributes: ['id', 'username', 'password', 'roleId'],
           // where: query,
            logging: console.log,
        });



        res.json(users);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
