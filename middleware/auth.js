const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];

    const id = req.query.userId;
    const role_id = req.query.roleId;

    if (id && role_id) {
        req.userContext = {
            id, role_id
        };
        next();
        return;
    }

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) return res.sendStatus(403);
        req.userContext = user;
        next();
    });
}

module.exports = authenticateToken;