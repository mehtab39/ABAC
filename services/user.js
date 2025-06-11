const db = require("../database/db");

function getAttributes(userId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT region, department FROM user_attributes WHERE user_id = ?`, [userId], (err, row) => {
            if (err) {
                return reject('DB error')
            }

            if (!row) {
                return reject('Attributes not found');
            }

            resolve({ userId, ...row });
        });
    })
}

module.exports = {getAttributes}