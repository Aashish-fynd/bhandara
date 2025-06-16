import { FindOptions, Model, ModelStatic, Op, Transaction } from "sequelize";
import { IPaginationParams } from "@/definitions/types";
import { getDBConnection } from "@connections/db";

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
    next: next ?? undefined,
    sortBy: sortBy ?? "createdAt",
    sortOrder: sortOrder ?? "desc",
  };

  const options: FindOptions = {
    raw: true,
    where: { ...where },
    order: [[_pagination.sortBy, _pagination.sortOrder.toUpperCase() as any]],
  };

  if (select) options.attributes = select.split(",").map((s) => s.trim());

  if (next) {
    (options.where as any)[_pagination.sortBy] = {
      [_pagination.sortOrder === "asc" ? Op.gt : Op.lt]: next,
    };
    options.limit = _pagination.limit + 1;
  } else {
    options.limit = _pagination.limit;
    options.offset = (_pagination.page - 1) * _pagination.limit;
  }

  if (modifyOptions) modifyOptions(options);

  const { rows, count } = await model.findAndCountAll(options);
  const resultItems = rows.slice(0, _pagination.limit) as T[];
  const paginationObj: IPaginationParams = {
    limit: _pagination.limit,
    page: _pagination.page,
    next: _pagination.next,
    total: count,
    sortBy: _pagination.sortBy,
    sortOrder: _pagination.sortOrder,
  } as IPaginationParams;

  paginationObj.hasNext = rows.length > limit;

  if (next) {
    paginationObj.next =
      rows.length > _pagination.limit
        ? (rows as any)[_pagination.limit][_pagination.sortBy]
        : null;
    delete paginationObj.page;
    delete paginationObj.hasNext;
  } else {
    paginationObj.next = paginationObj.hasNext
      ? (rows as any)[_pagination.limit - 1][_pagination.sortBy]
      : null;
  }

  return {
    data: { items: resultItems, pagination: paginationObj },
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
): Promise<{ data: T | T[] | null; error: any }> {
  const [, updatedResult] = await model.update(data as any, {
    where: { id: id as any },
    returning: true,
  });

  return { data: updatedResult, error: null };
}

export async function deleteRecord<T extends Model>(
  model: ModelStatic<T>,
  id: string
): Promise<{ data: T | null; error: any }> {
  const row = await model.findByPk(id);
  if (!row) return { data: null, error: null };
  await (row as any).destroy();

  return { data: row.toJSON() as any, error: null };
}

export async function runTransaction<T>(cb: (t: Transaction) => Promise<T>) {
  const sequelize = getDBConnection();
  return sequelize.transaction(cb);
}
