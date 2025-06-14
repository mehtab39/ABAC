const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

function defineAbilityFor(permissions = []) {

    const customConditionsMap = new Map();

    const { can, build } = new AbilityBuilder(createMongoAbility);

    for (const permission of permissions) {
        const { caslConditions, customConditions } = getPermissionConditions(permission.conditions);
        can(permission.action, permission.subject, undefined, caslConditions);
        if (customConditions && Object.keys(customConditions).length > 0) {
            customConditionsMap.set(`${permission.action}:a:${permission.subject}`, customConditions)
        }
    }

    const ability = build({
        detectSubjectType: item => item.__type || item.type || item.constructor.name
    });

    ability.customConditionsMap = customConditionsMap;

    return ability;

}


function getPermissionConditions(conditions = {}) {
    const caslConditions = {};
    const customConditions = {};

    for (const [key, value] of Object.entries(conditions)) {
        if (key.startsWith('$')) {
            customConditions[key] = value;
        } else {
            caslConditions[key] = value;
        }
    }

    return { caslConditions, customConditions };
}


module.exports = { defineAbilityFor };
