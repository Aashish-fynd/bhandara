import { BadRequestError } from "@exceptions";
const validateParams = (paramNames) => {
    return (req, res, next) => {
        const missingParams = paramNames.filter((param) => !req.params[param]);
        if (missingParams.length > 0) {
            throw new BadRequestError(`Missing required parameters: ${missingParams.join(", ")}`);
        }
        next();
    };
};
export default validateParams;
//# sourceMappingURL=validateParams.js.map