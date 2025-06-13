import { EQueryOperator } from "@/definitions/enums";
import { IPaginationParams } from "@/definitions/types";
// Deprecated: Supabase service retained for backward compatibility
import SupabaseService from "@supabase"; // Deprecated for DB operations
import DBService from "@/database/dbService";
import { SimpleFilter } from "@supabase";
import { omit } from "@utils";

interface QuerySupabaseArgs<T> {
  table: string;
  query?: Array<SimpleFilter & { column: keyof T }>;
  modifyQuery?: (query: any) => any;
  select?: string;
}

export type BaseQueryArgs<T> = Omit<QuerySupabaseArgs<T>, "table">;

class Base<T extends Record<string, any>> {
  /** @deprecated Use _dbService for database operations */
  protected readonly _supabaseService: SupabaseService;
  protected readonly _dbService: DBService;
  private readonly _model: any;

  constructor(model: any) {
    this._model = model;
    this._supabaseService = new SupabaseService();
    this._dbService = new DBService();
  }

  async getAll(
    args: BaseQueryArgs<T> = {},
    pagination: Partial<IPaginationParams> = {}
  ): Promise<{
    data?: {
      items: T[];
      pagination: Omit<IPaginationParams, "sortBy" | "sortOrder"> & {
        total: number;
      };
    };
    error: any;
  }> {
    const _pagination = {
      ...pagination,
      limit: pagination?.limit || 10,
      page: pagination?.page || 1,
      next: pagination?.next || null,
      sortBy: pagination?.sortBy || "createdAt",
      sortOrder: pagination?.sortOrder || "desc",
    };

    const from = (_pagination.page - 1) * _pagination.limit;

    const filters = (args.query || []) as any[];
    if (_pagination.next) {
      filters.push({
        column: _pagination.sortBy as any,
        operator:
          _pagination.sortOrder === "asc" ? EQueryOperator.Gt : EQueryOperator.Lt,
        value: _pagination.next,
      });
    }

    const { data, count } = await this._dbService.query<any>(this._model, {
      query: filters,
      select: args.select,
      modifyOptions: (opts) => {
        opts.order = [[_pagination.sortBy, _pagination.sortOrder.toUpperCase()]];
        if (_pagination.next) {
          opts.limit = _pagination.limit + 1;
        } else {
          opts.offset = from;
          opts.limit = _pagination.limit;
        }
        if (args.modifyQuery) opts = args.modifyQuery(opts) || opts;
        return opts;
      },
      count: true,
    });

    let paginationObj: any = {
      limit: _pagination.limit,
      page: _pagination.page,
      total: count || 0,
      hasNext: data?.length > _pagination.limit,
      next: null as any,
    };

    if (_pagination.next) {
      paginationObj.next =
        data?.length > _pagination.limit
          ? (data as T[])[_pagination.limit]?.createdAt
          : null;
      delete paginationObj.page;
      delete paginationObj.hasNext;
    } else {
      paginationObj.next = paginationObj.hasNext
        ? (data as T[])[_pagination.limit - 1]?.createdAt
        : null;
    }

    return {
      data: {
        items: data?.slice(0, _pagination.limit) as T[],
        pagination: paginationObj,
      },
      error: null,
    };
  }

  getById(id: string): Promise<{ data: T | null; error: any }> {
    return this._model
      .findByPk(id)
      .then((res: any) => ({ data: res, error: null }));
  }

  async create(data: Partial<T>): Promise<{ data: T | null; error: any }> {
    const _data = omit(data, ["deletedAt", "updatedAt"]);
    return this._dbService.insert(this._model, _data);
  }

  async update(id: string, data: Partial<T>): Promise<{ data: T | null; error: any }> {
    const _data = omit(data, ["id", "createdAt"]);
    return this._dbService.updateById(this._model, id, _data);
  }

  delete(id: string): Promise<{ data: T | null; error: any }> {
    return this._dbService.deleteById(this._model, id);
  }

  /**
   * Wrapper function to execute operations within a Supabase transaction
   * @param operation Function containing the database operation(s)
   * @returns Promise with the operation result
   *
   * @example
   * // Example usage:
   * const result = await withTransaction(async (client) => {
   *   const { data: user } = await client
   *     .from('users')
   *     .insert({ name: 'John' })
   *     .select()
   *     .single();
   *
   *   const { data: profile } = await client
   *     .from('profiles')
   *     .insert({ userId: user.id })
   *     .select()
   *     .single();
   *
   *   return { user, profile };
   * });
   */
  async withTransaction<T>(operation: (tx: any) => Promise<T>) {
    return this._dbService.transaction(operation);
  }
}

export default Base;
