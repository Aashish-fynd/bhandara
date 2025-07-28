import logger from "@logger";
const paginationParser = (req, res, next) => {
    const { limit, sortBy, sortOrder, next: _next, page, startDate, endDate, } = req.query;
    const parsedLimit = +(limit ?? 10);
    const parsedPageNumber = +(page ?? 1);
    const parsedSortBy = sortBy !== "createdAt" && sortBy !== "updatedAt" ? null : sortBy;
    const parsedSortOrder = sortOrder !== "asc" && sortOrder !== "desc" ? null : sortOrder;
    let parsedStartDate = startDate ? new Date(startDate) : null;
    let parsedEndDate = endDate ? new Date(endDate) : null;
    // Set invalid dates to null
    if (startDate && parsedStartDate?.toString() === "Invalid Date") {
        logger.warn(`Invalid startDate format: ${startDate}, setting to null`);
        parsedStartDate = null;
    }
    if (endDate && parsedEndDate?.toString() === "Invalid Date") {
        logger.warn(`Invalid endDate format: ${endDate}, setting to null`);
        parsedEndDate = null;
    }
    // add parsed pagination parameters to request object
    req.pagination = {
        limit: parsedLimit,
        page: parsedPageNumber,
        sortBy: parsedSortBy,
        sortOrder: parsedSortOrder,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        next: _next,
    };
    return next();
};
export default paginationParser;
//# sourceMappingURL=paginationParser.js.map