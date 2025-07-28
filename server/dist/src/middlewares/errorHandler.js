import logger from "@/logger";
import CustomError from "@exceptions/CustomError";
/**
 * Handles errors and sends appropriate HTTP responses.
 * @function errorHandler
 * @param {any} err - The error object.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next function.
 */
const errorHandler = (err, req, res, next) => {
    logger.error(err);
    // Check if the error is an instance of CustomError
    if (!(err instanceof CustomError)) {
        // If not a CustomError, send a generic internal server error response
        res.status(err?.status || 500).json({
            error: {
                message: err.message || "Internal server error. Try again later",
                type: err.name || "InternalServerError",
                status: err.status || 500,
            },
            success: false,
        });
    }
    else {
        const customError = err;
        let response = { message: customError.message };
        // Include additional information in the response if available
        if (customError.additionalInfo) {
            response.additionalInfo = customError.additionalInfo;
        }
        if (customError.name)
            response.type = customError.name;
        if (customError.status)
            response.status = customError.status;
        // Send a JSON response with the appropriate status code and error message
        return res
            .status(customError.status)
            .json({ error: response, success: false });
    }
};
export default errorHandler;
//# sourceMappingURL=errorHandler.js.map