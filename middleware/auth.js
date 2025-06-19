function authenticateToken(req, res, next) {
    const id = req.query.userId;

    req.userContext = {
        id
    };

    next();
}

module.exports = authenticateToken;