
const interpolateString = (text, context) => {
  const pattern = /\$\{(.+?)\}/g;
  const result = text.replace(pattern, (_, key) => {
    let value = context;
    for (const prop of key.split(".")) {
      if (typeof value[prop] !== "undefined") {
        value = value[prop];
      } else {
        return _; // return original placeholder if not found
      }
    }
    return value;
  });
  return !isNaN(result) ? +result : result;
};

 const interpolate = (target, context) => {
  if (typeof target === "string") {
    return interpolateString(target, context);
  } else if (Array.isArray(target)) {
    return target.map(value => interpolate(value, context));
  } else if (target && typeof target === "object") {
    return Object.fromEntries(
      Object.entries(target).map(([k, v]) => [k, interpolate(v, context)])
    );
  }
  return target;
};



module.exports = {
  interpolate,
  interpolateString
};
