/**
 * Represents a custom error object that extends the built-in Error class.
 * @class CustomError
 * @extends Error
 */
class CustomError extends Error {
    /**
     * Error message.
     * @type {string}
     */
    message;
    /**
     * HTTP status code associated with the error.
     * @type {number}
     */
    status;
    /**
     * Additional information about the error.
     * @type {any}
     */
    additionalInfo;
    /**
     * Creates a new instance of CustomError.
     * @constructor
     * @param {string} message - The error message.
     * @param {number} [status=500] - The HTTP status code associated with the error. Default is 500 (Internal Server Error).
     * @param {any} [additionalInfo=undefined] - Additional information about the error.
     */
    constructor(message, status = 500, additionalInfo = undefined) {
        super(message);
        Object.setPrototypeOf(this, CustomError.prototype);
        this.message = message;
        this.status = status;
        this.additionalInfo = additionalInfo;
    }
}
export default CustomError;
//# sourceMappingURL=CustomError.js.map