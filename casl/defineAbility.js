const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

function defineAbilityFor(permissions = []) {

    const { can, build } = new AbilityBuilder(createMongoAbility);

    for (const permission of permissions) {
        can(permission.action, permission.subject, undefined, permission.conditions);
    }

    const ability = build({
        detectSubjectType: item => item.__type || item.type || item.constructor.name
    });

    return ability;
}




module.exports = { defineAbilityFor };
