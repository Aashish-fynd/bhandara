import { EQueryOperator } from "@definitions/enums";
export const formQueryFromObject = (obj, operator = EQueryOperator.Eq) => {
    return Object.entries(obj).map(([key, value]) => ({
        column: key,
        operator,
        value,
    }));
};
//# sourceMappingURL=helpers.js.map