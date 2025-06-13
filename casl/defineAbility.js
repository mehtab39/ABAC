const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

function defineAbilityFor(permissions = []) {

    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    for (const permission of permissions) {
        const method = permission.inverted ? cannot : can;
        method.call(null, permission.action, permission.subject, undefined, permission.conditions);
    }

    return build({
        detectSubjectType: item => item.__type || item.type || item.constructor.name
    });

}

module.exports = { defineAbilityFor };
