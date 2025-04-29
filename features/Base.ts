import { EQueryOperator } from "@/definitions/enums";
import { IPaginationParams } from "@/definitions/types/global";
import { SimpleFilter, SupabaseService } from "@/helpers";
import { PostgrestError } from "@supabase/supabase-js";

interface QuerySupabaseArgs<T> {
  table: string;
  query?: Array<SimpleFilter & { column: keyof T }>;
  modifyQuery?: (query: any) => any;
  select?: string;
}

export type BaseQueryArgs<T> = Omit<QuerySupabaseArgs<T>, "table">;

class Base<T extends Record<string, any>> {
  protected readonly supabaseService: SupabaseService;
  private readonly tableName: string;

  constructor(table: string) {
    console.log("table", table);
    this.tableName = table;
    this.supabaseService = new SupabaseService();
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
      limit: 10,
      page: 1,
      next: null,
      sortBy: "createdAt",
      sortOrder: "desc",
      ...pagination
    };

    const from = (_pagination.page - 1) * _pagination.limit;

    const { data, error } = await this.supabaseService.querySupabase<T>({
      table: this.tableName,
      modifyQuery: (qb: any) => {
        if (_pagination.sortOrder === "asc") {
          qb = qb.order(_pagination.sortBy, { ascending: true });
        } else {
          qb = qb.order(_pagination.sortBy, { ascending: false });
        }
        if (_pagination.next) qb = qb.gt(_pagination.sortBy, _pagination.next);
        qb = qb.range(from, from + _pagination.limit + 1);

        if (args?.modifyQuery) qb = args.modifyQuery(qb);
        return qb;
      },
      ...args
    });

    if (error) return { error };

    return {
      data: {
        items: data as T[],
        pagination: {
          limit: _pagination.limit,
          page: _pagination.page,
          next: data?.length > _pagination.limit ? (data as T[])[data?.length - 1]?.createdAt : null,
          hasNext: data?.length > _pagination.limit
        }
      },
      error: null
    };
  }

  getById(id: string): Promise<{ data: T | null; error: PostgrestError | null }> {
    return this.supabaseService.querySupabase<T>({
      table: this.tableName,
      query: [{ column: "id", operator: EQueryOperator.Eq, value: id }],
      modifyQuery: (qb: any) => qb.single()
    }) as Promise<{ data: T | null; error: PostgrestError | null }>;
  }

  /**
   * Helper method to handle operations with optional transaction support
   * @param operation Function containing the database operation
   * @param useTransaction Whether to use transaction
   */
  private async handleOperation<U>(
    operation: (client: typeof this.supabaseClient) => Promise<{ data: U[] | null; error: PostgrestError | null }>,
    useTransaction: boolean = false
  ): Promise<{ data: U[] | null; error: PostgrestError | null }> {
    if (useTransaction) {
      const result = await this.supabaseService.transaction((client) => operation(client));
      return {
        data: result?.data?.data ?? null,
        error: result?.error ?? null
      };
    }
    return operation(this.supabaseClient);
  }

  async create<U extends Partial<Omit<T, "id" | "updatedAt">>>(
    data: U,
    useTransaction: boolean = false
  ): Promise<{ data: U[] | null; error: PostgrestError | null }> {
    return this.handleOperation<U>(async (client) => {
      const result = await client.from(this.tableName).insert(data).select();
      return result;
    }, useTransaction);
  }

  async update<U extends Partial<T>>(
    id: string,
    data: U,
    useTransaction: boolean = false
  ): Promise<{
    data: U[] | null;
    error: PostgrestError | null;
  }> {
    return this.handleOperation<U>(async (client) => {
      const result = await client.from(this.tableName).update(data).eq("id", id).select();
      return result;
    }, useTransaction);
  }

  delete(id: string): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    return this.supabaseService.deleteById({
      table: this.tableName,
      id
    });
  }

  protected get supabaseClient() {
    return this.supabaseService.supabaseClient;
  }
}

export default Base;
