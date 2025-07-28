/** Stringify JSON without additional options. */
export const jnstringify = (payload) => JSON.stringify(payload);
/** Parse a JSON string returning the typed value. */
export const jnparse = (payload) => JSON.parse(payload);
/**
 * Return a new object containing only the specified keys.
 */
export const pick = (obj, keys) => {
    return keys.reduce((acc, key) => {
        if (obj[key] !== undefined) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
};
/**
 * Return a new object without the specified keys.
 */
export const omit = (obj, keys) => {
    const newObj = { ...obj };
    keys.forEach((key) => {
        delete newObj[key];
    });
    return newObj;
};
/** Check if a value is considered empty. */
export const isEmpty = (value) => {
    if (value === null || value === undefined)
        return true;
    if (typeof value === "string")
        return value.trim() === "";
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === "object")
        return Object.keys(value).length === 0;
    return false;
};
/** Deep merge multiple objects. */
export const merge = (...objects) => {
    const result = {};
    objects.forEach((obj) => {
        if (obj && typeof obj === "object") {
            Object.keys(obj).forEach((key) => {
                if (obj[key] &&
                    typeof obj[key] === "object" &&
                    !Array.isArray(obj[key])) {
                    result[key] = merge(result[key] || {}, obj[key]);
                }
                else {
                    result[key] = obj[key];
                }
            });
        }
    });
    return result;
};
/** Remove empty values from a query object. */
export const cleanQueryObject = (query) => {
    const cleanedQuery = {};
    Object.keys(query).forEach((key) => {
        if (query[key] !== undefined && query[key] !== "") {
            cleanedQuery[key] = query[key];
        }
    });
    return cleanedQuery;
};
//# sourceMappingURL=index.js.map