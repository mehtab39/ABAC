const jwt = require('jsonwebtoken');
const { defineAbilityFor } = require('../casl/defineAbility');
const { getPermissionsForUser } = require('../services/permissions');

async function attachUserContext(user, permissions) {
    const ability = defineAbilityFor(permissions);
    return {
        ...user,
        ability,
    };
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);

        try {
            const permissions = await getPermissionsForUser(user);
            if (req.path === '/permissions' && req.method === 'GET') {
                return res.json({
                    permissions: permissions,
                    userId: user.id,
                });
            }

            const context = await attachUserContext(user, permissions);
            req.userContext = context;
            next();
        } catch (e) {
            console.error('Failed to fetch user policy context:', e);
            res.sendStatus(500);
        }
    });
}

module.exports = authenticateToken;
