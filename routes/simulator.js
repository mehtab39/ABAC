const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const attachPermissions = require('../middleware/permission');
const { toSequelizeQuery, serializeSequelizeQuery } = require('../casl/toSequilizeQuery');


router.post('/', authenticateToken,attachPermissions,  async (req, res) => {
    const { subject, action, resource } = req.body;

    if (!subject || !action) {
        return res.status(400).json({
            error: 'Missing required fields: subject, action, resource'
        });
    }

    try {
        const ability = req.userContext?.ability;

        if (!ability) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const allowed = ability.can(action, {__type: subject, ...(resource || {})});


        const sqlQuery = toSequelizeQuery(ability, subject, action);

        return res.json({
            allowed,
            reason: allowed ? 'Permission granted' : 'Permission denied',
            sqlQuery: serializeSequelizeQuery(sqlQuery),
            evaluated: {
                action,
                subject,
                resource
            }
        });
    } catch (err) {
        console.error('ABAC check failed:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

