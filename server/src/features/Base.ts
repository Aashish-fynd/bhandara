import { EQueryOperator } from "@/definitions/enums";
import { IPaginationParams } from "@/definitions/types";
import SupabaseService, { SimpleFilter, SupabaseClient } from "@supabase";
import { PostgrestError } from "@supabase/supabase-js";
import { omit } from "@utils";

interface QuerySupabaseArgs<T> {
  table: string;
  query?: Array<SimpleFilter & { column: keyof T }>;
  modifyQuery?: (query: any) => any;
  select?: string;
}

export type BaseQueryArgs<T> = Omit<QuerySupabaseArgs<T>, "table">;

class Base<T extends Record<string, any>> {
  protected readonly _supabaseService: SupabaseService;
  private readonly tableName: string;

  constructor(table: string) {
    this.tableName = table;
    this._supabaseService = new SupabaseService();
  }

  async getAll(
    args: BaseQueryArgs<T> = {},
    pagination: Partial<IPaginationParams> = {}
  ): Promise<{
    data?: {
      items: T[];
      pagination: Omit<IPaginationParams, "sortBy" | "sortOrder">;
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

    const { data, error } = await this._supabaseService.querySupabase<T>({
      table: this.tableName,
      modifyQuery: (qb: any) => {
        if (_pagination?.sortOrder && _pagination?.sortBy) {
          qb = qb.order(_pagination.sortBy, {
            ascending: _pagination.sortOrder === "asc",
          });
        }

        if (_pagination.startDate)
          qb = qb.gte(_pagination.sortBy, _pagination.startDate);
        if (_pagination.endDate)
          qb = qb.lte(_pagination.sortBy, _pagination.endDate);

        if (_pagination.next) {
          qb = qb
            .gt(_pagination.sortBy, _pagination.next)
            .limit(_pagination.limit + 1);
        } else {
          qb = qb.range(from, from + _pagination.limit - 1);
        }

        if (args?.modifyQuery) qb = args.modifyQuery(qb);
        return qb;
      },
      ...args,
    });

    if (error) throw new Error(error.message);

    return {
      data: {
        items: data?.slice(0, _pagination.limit) as T[],
        pagination: {
          limit: _pagination.limit,
          page: _pagination.page,
          next:
            data?.length > _pagination.limit
              ? (data as T[])[_pagination.limit - 1]?.createdAt
              : null,
          hasNext: data?.length > _pagination.limit,
        },
      },
      error: null,
    };
  }

  getById(
    id: string
  ): Promise<{ data: T | null; error: PostgrestError | null }> {
    return this._supabaseService.querySupabase<T>({
      table: this.tableName,
      query: [{ column: "id", operator: EQueryOperator.Eq, value: id }],
      modifyQuery: (qb) => qb.maybeSingle(),
    }) as Promise<{ data: T | null; error: PostgrestError | null }>;
  }

  async create(data: Partial<T>) {
    const _data = omit(data, ["deletedAt", "updatedAt"]);
    return this._supabaseService.insertIntoDB<Partial<T>>({
      table: this.tableName,
      data: _data,
    }) as Promise<{
      data: T[] | null;
      error: PostgrestError | null;
    }>;
  }

  async update(id: string, data: Partial<T>) {
    const _data = omit(data, ["id", "createdAt"]);
    return this._supabaseService.updateById<T>({
      table: this.tableName,
      id,
      data: _data,
    });
  }

  delete(
    id: string
  ): Promise<{ data: T | null; error: PostgrestError | null }> {
    return this._supabaseService.deleteById({
      table: this.tableName,
      id,
    });
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
  async withTransaction<T>(operation: (client: SupabaseClient) => Promise<T>) {
    return this._supabaseService.transaction(operation);
  }
}

export default Base;
