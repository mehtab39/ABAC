function getCustomConditions(ability,subject, action, key) {
    if (
        !ability || typeof ability !== 'object' ||
        !ability.customConditionsMap || !(ability.customConditionsMap instanceof Map)
    ) {
        return null;
    }


    const customConditionKey = `${action}:a:${subject}`;

    if (!ability.customConditionsMap.has(customConditionKey)) {
        return null;
    }

    const conditions = ability.customConditionsMap.get(customConditionKey);

    if (
        !conditions ||
        typeof conditions !== 'object' ||
        Array.isArray(conditions) ||
        !(key in conditions)
    ) {
        return null;
    }

    return conditions[key];
}

module.exports = { getCustomConditions };



