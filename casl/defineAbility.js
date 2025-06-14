const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

function defineAbilityFor(permissions = []) {

    const { can, build } = new AbilityBuilder(createMongoAbility);

    for (const permission of permissions) {
        can(permission.action, permission.subject, undefined, permission.conditions);
    }

    return build({
        detectSubjectType: item => item.__type || item.type || item.constructor.name
    });

}

module.exports = { defineAbilityFor };
