import { EQueryOperator } from "@/definitions/enums";
import { SupabaseService } from "@/helpers";
import { PostgrestError } from "@supabase/supabase-js";

interface QuerySupabaseArgs {
  table: string;
  query?: Array<{ column: string; operator: EQueryOperator; value: any }>;
  modifyQuery?: (query: any) => any;
  select?: string;
}

type QueryArgs = Omit<QuerySupabaseArgs, "table">;

class Base<T extends Record<string, any>> {
  protected readonly supabaseService: SupabaseService;
  private readonly tableName: string;

  constructor(table: string) {
    this.tableName = table;
    this.supabaseService = new SupabaseService();
  }

  getAll(args: QueryArgs = {}): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    return this.supabaseService.querySupabase<T>({
      table: this.tableName,
      ...args
    }) as Promise<{ data: T[] | null; error: PostgrestError | null }>;
  }

  getById(id: string): Promise<{ data: T | null; error: PostgrestError | null }> {
    return this.supabaseService.querySupabase<T>({
      table: this.tableName,
      query: [{ column: "id", operator: EQueryOperator.Eq, value: id }],
      modifyQuery: (qb: any) => qb.single()
    }) as Promise<{ data: T | null; error: PostgrestError | null }>;
  }

  create<U extends Partial<T>>(data: U): Promise<{ data: U[] | null; error: Error | null }> {
    return this.supabaseService.insertIntoDB({
      table: this.tableName,
      data,
      selecting: true
    });
  }

  update<U extends Partial<T>>(id: string, data: U): Promise<{ data: U[] | null; error: PostgrestError | null }> {
    return this.supabaseService.updateById<U>({
      id,
      table: this.tableName,
      data
    });
  }

  delete(id: string): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    return this.supabaseService.deleteById({
      table: this.tableName,
      id
    });
  }
}

export default Base;
