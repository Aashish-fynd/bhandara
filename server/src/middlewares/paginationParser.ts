import { IRequestPagination } from "@definitions/interfaces";
import { jnstringify } from "@lib/utils";
import logger from "@src/logger";
import { NextFunction, Response } from "express";

const paginationParser = (
  req: IRequestPagination,
  res: Response,
  next: NextFunction
) => {
  const {
    limit,
    sortBy,
    sortOrder,
    populate,
    pageNumber,
    fieldsToPopulate,
    startDate,
    endDate,
  } = req.query;
  const parsedPopulateFields = (fieldsToPopulate as string)?.split(",");
  const parsedLimit = limit ? +(limit ?? 10) : null;
  const parsedPageNumber = +(pageNumber ?? 1);
  const parsedSortBy =
    sortBy !== "createdAt" && sortBy !== "updatedAt" ? null : sortBy;

  const parsedSortOrder =
    sortOrder !== "asc" && sortOrder !== "desc" ? null : sortOrder;
  const parsedDoPopulate = populate === "true";

  let parsedStartDate = startDate ? new Date(startDate as string) : null;
  let parsedEndDate = endDate ? new Date(endDate as string) : null;

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
    sortBy: parsedSortBy,
    sortOrder: parsedSortOrder,
    doPopulate: parsedDoPopulate,
    pageNumber: parsedPageNumber,
    populateFields: parsedPopulateFields,
    startDate: parsedStartDate,
    endDate: parsedEndDate,
  };

  return next();
};

export default paginationParser;
