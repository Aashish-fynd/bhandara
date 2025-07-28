import { RequestContext } from "@contexts";
import { getAlphaNumericId } from "@helpers";
import logger from "@logger";
import { AsyncLocalStorage } from "async_hooks";
const asyncLocalStorage = new AsyncLocalStorage();
const requestContextMiddleware = async (req, res, next) => {
    // Generate a unique request ID or use one from headers if provided
    const requestId = req.headers["x-request-id"] || getAlphaNumericId();
    const startTime = Date.now();
    const context = {
        requestId,
        timings: {
            start: startTime,
        },
    };
    // res.on("finish", () => {
    //   const endTime = Date.now();
    //   const totalTime = endTime - startTime;
    //   context.timings = {
    //     ...context.timings,
    //     end: endTime,
    //     total: totalTime,
    //   };
    //   logger.info(
    //     `Request ID: [${requestId}] ${req.method} ${req.url} ${totalTime}ms ${res.statusCode}`
    //   );
    //   return next();
    // });
    // res.setHeader("X-Request-ID", requestId);
    // Store the original next function
    try {
        RequestContext.run(context, async () => {
            next();
        });
    }
    catch (error) {
        logger.error("In context error", error);
    }
};
export default requestContextMiddleware;
//# sourceMappingURL=request.js.map