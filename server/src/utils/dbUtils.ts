import { FindOptions, Model, ModelStatic, Op, Transaction } from "sequelize";
import { IPaginationParams } from "@/definitions/types";
import { getDBConnection } from "@connections/db";
import logger from "@logger";

export interface PaginatedResult<T> {
  items: T[];
  pagination: IPaginationParams;
}
export async function findAllWithPagination<T extends Model>(
  model: ModelStatic<T>,
  where: Record<string, any> = {},
  pagination: Partial<IPaginationParams> = {},
  select?: string,
  modifyOptions?: (opts: FindOptions) => FindOptions
): Promise<{ data: PaginatedResult<T>; error: any }> {
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

  return {
    data: { items, pagination: paginationResult },
    error: null,
  };
}

export async function findById<T extends Model>(
  model: ModelStatic<T>,
  id: string
): Promise<{ data: T | null; error: any }> {
  const res = await model.findByPk(id, { raw: true });
  return { data: res as any, error: null };
}

export async function createRecord<T extends Model>(
  model: ModelStatic<T>,
  data: Partial<T>
): Promise<{ data: T | null; error: any }> {
  const row = await model.create(data as any);
  return { data: row.toJSON() as T, error: null };
}

export async function updateRecord<T extends Model>(
  model: ModelStatic<T>,
  id: string,
  data: Partial<T>
): Promise<{ data: T | null; error: any }> {
  const [, updatedResult] = await model.update(data as any, {
    where: { id: id as any },
    returning: true,
  });

  if (updatedResult.length > 1) {
    logger.warn(`Found records ${updatedResult.length} matching id:${id}`);
  }

  return { data: updatedResult[0], error: null };
}

export async function deleteRecord<T extends Model>(
  model: ModelStatic<T>,
  id: string,
  skipGet = false
): Promise<{ data: T | null | number; error: any }> {
  if (skipGet) {
    const result = await model.destroy({ where: { id: id as any } });
    return { data: result, error: null };
  }
  const row = await model.findByPk(id);
  if (!row) return { data: null, error: null };
  await (row as any).destroy();

  return { data: row.toJSON() as any, error: null };
}

export async function runTransaction<T>(cb: (t: Transaction) => Promise<T>) {
  const sequelize = getDBConnection();
  return sequelize.transaction(cb);
}
