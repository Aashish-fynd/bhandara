import { BadRequestError } from "@exceptions";
export const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, { abortEarly: false });
        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(", ");
            throw new BadRequestError(`Validation error: ${errorMessage}`);
        }
        // Replace req.query with validated data
        req.query = value;
        next();
    };
};
export const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(", ");
            throw new BadRequestError(`Validation error: ${errorMessage}`);
        }
        // Replace req.body with validated data
        req.body = value;
        next();
    };
};
export const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, { abortEarly: false });
        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(", ");
            throw new BadRequestError(`Validation error: ${errorMessage}`);
        }
        // Replace req.params with validated data
        req.params = value;
        next();
    };
};
//# sourceMappingURL=validation.js.map