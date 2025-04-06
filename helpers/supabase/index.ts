import supabase from "@/lib/supabase";
import { PostgrestError } from "@supabase/supabase-js";
import {
  PostgrestBuilder,
  PostgrestFilterBuilder
} from "@supabase/postgrest-js";
import { EQueryOperator } from "@/definitions/enums";
import { decode } from "base64-arraybuffer";

export type SimpleFilter = {
  column: string;
  operator: EQueryOperator;
  value: string | number | boolean | null | Array<string | number | boolean>;
};

export type QueryFilter =
  | SimpleFilter
  | { And: QueryFilter[] }
  | { Or: QueryFilter[] };

export class SupabaseService {
  public readonly supabaseClient = supabase;

  /**
   * Get results from database with a custom selection query
   * @param {Object} params - The query parameters
   * @param {string} params.table - The table name
   | {string} params.selectionQuery - The selection query string
   */
  async getResultsFromDB({
    table,
    selectionQuery
  }: {
    table: string;
    selectionQuery: string;
  }) {
    return this.querySupabase({ table, select: selectionQuery });
  }

  /**
   * Query the Supabase database with filters and custom selection
   * @param {Object} params - The query parameters
   * @param {string} params.table - The table name
   * @param {QueryFilter[]} [params.query] - Array of query filters
   * @param {string} [params.select="*"] - Selection query string
   * @param {Function} [params.modifyQuery] - Custom query modifier function
   */
  async querySupabase<T extends Record<string, any>>({
    table,
    query,
    select = "*",
    modifyQuery
  }: {
    table: string;
    query?: QueryFilter[];
    select?: string;
    modifyQuery?: (
      qb: PostgrestFilterBuilder<any, T, T[]>
    ) => PostgrestFilterBuilder<any, T, T[]> | PostgrestBuilder<T>;
  }): Promise<{ data: T | T[] | null; error: PostgrestError | null }> {
    let queryBuilder = this.supabaseClient
      .from(table)
      .select(select) as PostgrestFilterBuilder<any, T, T[]>;

    if (query && query.length > 0) {
      query.forEach((filter) => {
        if ("And" in filter) {
          // Apply AND conditions by chaining filters
          filter.And.forEach((subFilter) => {
            const { column, operator, value } = subFilter as {
              column: string;
              operator: EQueryOperator;
              value: any;
            };
            queryBuilder = (queryBuilder as any)[operator](column, value);
          });
        } else if ("Or" in filter) {
          // For OR conditions, we need to use the or() with filter string
          const orFilters = filter.Or.map((subFilter) => {
            const { column, operator, value } = subFilter as {
              column: string;
              operator: EQueryOperator;
              value: any;
            };
            return `${column}.${operator}.${value}`;
          }).join(",");
          queryBuilder = queryBuilder.or(orFilters);
        } else {
          // Handle simple filter
          const { column, operator, value } = filter as {
            column: string;
            operator: EQueryOperator;
            value: any;
          };
          queryBuilder = (queryBuilder as any)[operator](column, value);
        }
      });
    }

    if (modifyQuery) {
      queryBuilder = modifyQuery(queryBuilder) as any;
    }

    return queryBuilder;
  }

  /**
   * Insert data into the Supabase database
   * @param {Object} params - The insert parameters
   * @param {string} params.table - The table name
   * @param {T} params.data - The data to insert
   * @param {boolean} [params.selecting=false] - Whether to return the inserted data
   */
  async insertIntoDB<T extends Record<string, any>>({
    table,
    data,
    selecting = false
  }: {
    table: string;
    data: T;
    selecting?: boolean;
  }): Promise<{
    data: T[] | null;
    error: Error | null;
  }> {
    const baseQuery = this.supabaseClient.from(table).insert(data);
    if (selecting) return baseQuery.select();

    return baseQuery;
  }

  /**
   * Update a record by ID in the database
   * @param {Object} params - The update parameters
   * @param {string} params.table - The table name
   * @param {string} params.id - The record ID
   * @param {T} params.data - The update data
   */
  async updateById<T extends Record<string, any>>({
    table,
    id,
    data
  }: {
    table: string;
    id: string;
    data: T;
  }): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    return this.updateByQuery({
      table,
      data,
      query: [{ column: "id", operator: EQueryOperator.Eq, value: id }]
    });
  }

  /**
   * Update records by query in the database
   * @param {Object} params - The update parameters
   * @param {string} params.table - The table name
   * @param {T} params.data - The update data
   * @param {QueryFilter[]} params.query - Array of query filters
   */
  async updateByQuery<T extends Record<string, any>>({
    table,
    data,
    query
  }: {
    table: string;
    data: T;
    query: QueryFilter[];
  }): Promise<{ data: T[] | null; error: PostgrestError | null }> {
    let queryBuilder = this.supabaseClient.from(table);

    (query as SimpleFilter[]).forEach(({ column, operator, value }) => {
      queryBuilder = (queryBuilder as any)[operator](column, value);
    });

    return queryBuilder.update(data).select();
  }

  /**
   * Delete a record by ID from the database
   * @param {Object} params - The delete parameters
   * @param {string} params.table - The table name
   * @param {string} params.id - The record ID
   */
  async deleteById({
    table,
    id
  }: {
    table: string;
    id: string;
  }): Promise<{ data: any[] | null; error: PostgrestError | null }> {
    return this.supabaseClient.from(table).delete().eq("id", id).select();
  }

  /**
   * Uploads a file to a specified bucket in Supabase storage.
   *
   * @param params - The parameters for the file upload.
   * @param params.bucket - The name of the bucket where the file will be uploaded.
   * @param params.base64FileData - The file to be uploaded. Must be in base64 format.
   * @param params.path - The path within the bucket where the file will be stored.
   * @param params.mimeType - The MIME type of the file being uploaded.
   * @param params.options - Optional additional options for the upload, such as custom headers.
   *
   * @returns A promise that resolves with the result of the upload operation.
   */
  async uploadFile({
    bucket,
    path,
    base64FileData,
    mimeType,
    options = {}
  }: {
    bucket: string;
    path: string;
    mimeType: string;
    options?: Record<string, any>;
    base64FileData: string;
  }) {
    return this.supabaseClient.storage
      .from(bucket)
      .upload(path, decode(base64FileData), {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: true,
        ...options
      });
  }

  /**
   * Deletes a file from a specified bucket in Supabase storage.
   *
   * @param params - The parameters for the file deletion.
   * @param params.bucket - The name of the bucket where the file is located.
   * @param params.paths - An array of paths to the files to be deleted.
   *
   * @returns A promise that resolves with the result of the deletion operation.
   */
  async deleteFile({ bucket, paths }: { bucket: string; paths: string[] }) {
    return this.supabaseClient.storage.from(bucket).remove(paths);
  }

  /**
   * Generates a signed URL for downloading a file from a specified bucket in Supabase storage.
   *
   * @param params - The parameters for the signed URL generation.
   * @param params.bucket - The name of the bucket where the file is located.
   * @param params.path - The path to the file in the bucket.
   * @param params.options - Optional additional options for the signed URL, such as expiration time and transformations.
   *
   * @returns A promise that resolves with the signed URL for downloading the file.
   */
  async getSignedUrlForDownload({
    bucket,
    path,
    options = {}
  }: {
    bucket: string;
    path: string;
    options?: {
      expiresIn?: number;
      transformations?: Record<string, any>;
    };
  }) {
    const _options = {
      expiresIn: 60,
      ...options
    };
    return this.supabaseClient.storage
      .from(bucket)
      .createSignedUrl(
        path,
        _options?.expiresIn,
        _options?.transformations || {}
      );
  }

  /**
   * Execute multiple database operations within a transaction
   * @param callback Function containing the operations to execute in transaction
   * @returns Result of the transaction
   *
   * @example
   * // Example 1: Create user and profile in a transaction
   * const { data, error } = await supabaseService.transaction(async (client) => {
   *   // Insert a new user
   *   const { data: user } = await client
   *     .from('users')
   *     .insert({ name: 'John Doe', email: 'john@example.com' })
   *     .select()
   *     .single();
   *
   *   // Insert profile for the user
   *   const { data: profile } = await client
   *     .from('profiles')
   *     .insert({ user_id: user.id, bio: 'Software Developer' })
   *     .select()
   *     .single();
   *
   *   return { user, profile };
   * });
   *
   */
  async transaction<T>(
    callback: (client: typeof this.supabaseClient) => Promise<T>
  ): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      // Begin transaction
      await this.supabaseClient.rpc("begin");

      // Execute the callback with transaction
      const result = await callback(this.supabaseClient);

      // Commit transaction
      await this.supabaseClient.rpc("commit");

      return { data: result, error: null };
    } catch (error) {
      // Rollback transaction on error
      await this.supabaseClient.rpc("rollback");
      return { data: null, error: error as PostgrestError };
    }
  }
}

export default new SupabaseService();
