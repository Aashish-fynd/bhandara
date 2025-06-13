import { FindOptions, Model, ModelCtor, Op, Transaction } from "sequelize";
import { IPaginationParams } from "@/definitions/types";

export interface PaginatedResult<T> {
  items: T[];
  pagination: IPaginationParams;
}

export async function findAllWithPagination<T extends Model>(
  model: ModelCtor<T>,
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

  const options: FindOptions = {
    where: { ...where },
    order: [[sortBy, sortOrder.toUpperCase() as any]],
  };

  if (select) options.attributes = select.split(",").map((s) => s.trim());

  if (next) {
    (options.where as any)[sortBy] = {
      [sortOrder === "asc" ? Op.gt : Op.lt]: next,
    };
    options.limit = limit + 1;
  } else {
    options.limit = limit;
    options.offset = (page - 1) * limit;
  }

  if (modifyOptions) modifyOptions(options);

  const { rows, count } = await model.findAndCountAll(options);
  const resultItems = rows.slice(0, limit) as T[];
  const paginationObj: IPaginationParams = {
    limit,
    page,
    next: null,
    total: count,
    sortBy,
    sortOrder,
  } as IPaginationParams;

  paginationObj.hasNext = rows.length > limit;

  if (next) {
    paginationObj.next =
      rows.length > limit ? (rows as any)[limit][sortBy] : null;
    delete paginationObj.page;
    delete paginationObj.hasNext;
  } else {
    paginationObj.next = paginationObj.hasNext
      ? (rows as any)[limit - 1][sortBy]
      : null;
  }

  return { data: { items: resultItems, pagination: paginationObj }, error: null };
}

export async function findById<T extends Model>(
  model: ModelCtor<T>,
  id: string
): Promise<{ data: T | null; error: any }> {
  const res = await model.findByPk(id, { raw: true });
  return { data: res as any, error: null };
}

export async function createRecord<T extends Model>(
  model: ModelCtor<T>,
  data: Partial<T>
): Promise<{ data: T | null; error: any }> {
  const row = await model.create(data as any);
  return { data: row.toJSON() as any, error: null };
}

export async function updateRecord<T extends Model>(
  model: ModelCtor<T>,
  id: string,
  data: Partial<T>
): Promise<{ data: T | null; error: any }> {
  await model.update(data as any, { where: { id } });
  const updated = await model.findByPk(id, { raw: true });
  return { data: updated as any, error: null };
}

export async function deleteRecord<T extends Model>(
  model: ModelCtor<T>,
  id: string
): Promise<{ data: T | null; error: any }> {
  const row = await model.findByPk(id);
  if (!row) return { data: null, error: null };
  await (row as any).destroy();
  return { data: row.toJSON() as any, error: null };
}

export async function runTransaction<T>(
  model: ModelCtor<Model>,
  cb: (t: Transaction) => Promise<T>
) {
  return model.sequelize!.transaction(cb);
}
