const { AbilityBuilder, createMongoAbility } = require('@casl/ability');

function defineAbilityFor(policies = []) {
    const { can, cannot, build } = new AbilityBuilder(createMongoAbility);

    for (const policy of policies) {
        for (const rule of policy.rules || []) {
            const method = rule.inverted ? cannot : can;
            method.call(null, rule.action, rule.subject, rule.conditions);
        }
    }

    return build({
        detectSubjectType: item => item.type, 
    });
}

module.exports = { defineAbilityFor };
