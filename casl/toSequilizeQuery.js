const { rulesToQuery } = require('@casl/ability/extra');
const { Op } = require('sequelize');

function rulesToSequelizeQuery(input) {
    if (Array.isArray(input)) {
        return input.map(rulesToSequelizeQuery);
    }

    if (input && typeof input === 'object') {
        const output = {};

        for (const key in input) {
            const value = input[key];


            if (key.startsWith('$')) {
                const opKey = Op[key.slice(1)];


                // Special handling for known complex operators
                switch (key) {
                    case '$regex':
                        if (typeof value !== 'string') break;
                        if (value.startsWith('^') && value.endsWith('$')) {
                            return { [Op.eq]: value.slice(1, -1) };
                        } else if (value.startsWith('^')) {
                            return { [Op.like]: value.slice(1) + '%' };
                        } else if (value.endsWith('$')) {
                            return { [Op.like]: '%' + value.slice(0, -1) };
                        } else {
                            return { [Op.like]: '%' + value + '%' };
                        }

                    case '$exists':
                        return value === true
                            ? { [Op.not]: null }
                            : { [Op.is]: null };

                    case '$nin':
                        return { [Op.notIn]: rulesToSequelizeQuery(value) }


                    default:
                        return { [opKey]: rulesToSequelizeQuery(value) };
                }
            }

            if (value && typeof value === 'object' && !Array.isArray(value)) {
                output[key] = rulesToSequelizeQuery(value); // recurse
            } else {
                output[key] = value;
            }
        }

        return output;
    }

    return input;
}


function ruleToSequelize(rule) {
    return Object.keys(rule.conditions).length > 0 ? rule.conditions : null;
}

function toSequelizeQuery(ability,  action, subject) {
    const query = rulesToQuery(ability, action, subject, ruleToSequelize);
    if (query === null || !query.$or || query.$or.length === 0 || (query.$or[0] === null)) return null;
    const result = rulesToSequelizeQuery(query);
    return result;
}





module.exports = {
    toSequelizeQuery,
};