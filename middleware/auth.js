function authenticateToken(req, res, next) {
    const id = req.query.userId;
    const role_id = req.query.roleId;

    req.userContext = {
        id, role_id
    };

    next();
}

module.exports = authenticateToken;