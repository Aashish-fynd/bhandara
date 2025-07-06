import { FindOptions, Model, ModelStatic, Op } from "sequelize";
import { IPaginationParams } from "@/definitions/types";

export interface PaginatedResult<T> {
  items: T[];
  pagination: IPaginationParams;
}

/**
 * Retrieve records with pagination, supporting both cursor and offset modes.
 */
export async function findAllWithPagination<T extends Model>(
  model: ModelStatic<T>,
  where: Record<string, any> = {},
  pagination: Partial<IPaginationParams> = {},
  select?: string,
  modifyOptions?: (opts: FindOptions) => FindOptions
): Promise<PaginatedResult<T>> {
  const {
    limit = 10,
    page = 1,
    next = null,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = pagination;

  const _pagination = {
    limit: limit ?? 10,
    page: page ?? 1,
    next: next ?? null,
    sortBy: sortBy ?? "createdAt",
    sortOrder: sortOrder ?? "desc",
  };

  const isCursorMode = !!next;
  const effectiveLimit = limit + 1;

  const options: FindOptions = {
    raw: true,
    where: { ...where },
    order: [[_pagination.sortBy, _pagination.sortOrder.toUpperCase()]],
    limit: effectiveLimit,
  };

  // Select specific fields
  if (select) {
    options.attributes = select.split(",").map((s) => s.trim());
  }

  // Cursor-based pagination
  if (isCursorMode) {
    (options.where as any)[_pagination.sortBy] = {
      [_pagination.sortOrder === "asc" ? Op.gt : Op.lt]: _pagination.next,
    };
  } else {
    // Offset-based pagination
    options.offset = (_pagination.page - 1) * _pagination.limit;
  }

  // Allow user-defined modification
  if (modifyOptions) {
    Object.assign(options, modifyOptions(options));
  }

  const { rows, count } = await model.findAndCountAll(options);

  const hasNext = rows.length > _pagination.limit;
  const items = hasNext
    ? (rows.slice(0, _pagination.limit) as T[])
    : (rows as T[]);

  const paginationResult = {
    limit,
    total: count,
  } as IPaginationParams;

  if (isCursorMode) {
    paginationResult.next = hasNext
      ? rows[_pagination.limit][_pagination.sortBy]
      : null;
  } else {
    paginationResult.page = _pagination.page;
    paginationResult.hasNext = hasNext;
    paginationResult.next = hasNext
      ? rows[_pagination.limit - 1][_pagination.sortBy]
      : null;
  }

  return { items, pagination: paginationResult };
}
