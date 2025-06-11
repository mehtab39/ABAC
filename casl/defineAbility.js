const { AbilityBuilder, createMongoAbility } = require('@casl/ability');
const interpolate = require('interpolate-object');

function defineAbilityFor(policies = [], attributes) {

    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    for (const policy of policies) {
        for (const rule of policy.rules || []) {
            const method = rule.inverted ? cannot : can;
            const pattern = /\$\{(.+?)\}/g;
            const conditions = interpolate(rule.conditions, attributes, pattern);
            method.call(null, rule.action, rule.subject, conditions);
        }
    }

    return build({
        detectSubjectType: item => item.__type || item.type || item.constructor.name
    });

}

module.exports = { defineAbilityFor };
