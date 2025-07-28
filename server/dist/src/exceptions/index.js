import CustomError from "./CustomError";
export function createCustomErrorClass(className, defaultStatus = 500, defaultMessage) {
    // Dynamically create a new class that extends CustomError
    class DynamicCustomError extends CustomError {
        /**
         * Creates a new instance of the custom error.
         * @constructor
         * @param {string} message - The error message.
         * @param {number} [status=defaultStatus] - The HTTP status code associated with the error.
         * @param {any} [additionalInfo=undefined] - Additional information about the error.
         */
        constructor(message = defaultMessage, status = defaultStatus, additionalInfo = undefined) {
            super(message, status, additionalInfo);
            this.name = className; // Set the name of the error class
        }
    }
    // Set the name of the class dynamically
    Object.defineProperty(DynamicCustomError, "name", { value: className });
    return DynamicCustomError;
}
export const NotFoundError = createCustomErrorClass("NotFoundError", 404, "Resource not found");
export const BadRequestError = createCustomErrorClass("BadRequestError", 400, "Bad request");
export const UnauthorizedError = createCustomErrorClass("UnauthorizedError", 401, "Unauthorized access");
export const ForbiddenError = createCustomErrorClass("ForbiddenError", 403, "Forbidden access");
export class SupabaseCustomError extends Error {
    status;
    statusText;
    constructor(message, status, statusText) {
        super(message);
        this.status = status;
        this.name = statusText;
    }
}
//# sourceMappingURL=index.js.map