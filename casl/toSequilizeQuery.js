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

                if (!opKey) {
                    console.warn(`Unsupported operator "${key}"`);
                    continue;
                }

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
    return rule.inverted ? { $not: rule.conditions } : rule.conditions;
}

function toSequelizeQuery(ability, subject, action) {
    const query = rulesToQuery(ability, action, subject, ruleToSequelize);
    return query === null ? query : rulesToSequelizeQuery(query);
}



module.exports = {
    toSequelizeQuery,

};