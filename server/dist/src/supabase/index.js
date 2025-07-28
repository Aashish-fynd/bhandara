import { EQueryOperator } from "@/definitions/enums";
import { decode } from "base64-arraybuffer";
import { supabase } from "../connections";
import { SupabaseCustomError } from "@exceptions";
const throwSupabaseError = (res) => {
    throw new SupabaseCustomError(res.message || res.error?.message, res?.status, res.name || res?.statusText);
};
class SupabaseService {
    supabaseClient = supabase;
    /**
     * Get results from database with a custom selection query
     * @param {Object} params - The query parameters
     * @param {string} params.table - The table name
     | {string} params.selectionQuery - The selection query string
     */
    async getResultsFromDB({ table, selectionQuery, }) {
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
    async querySupabase({ table, query, select = "*", modifyQuery, count, }) {
        let queryBuilder = this.supabaseClient
            .from(table)
            .select(select, count ? { count } : undefined);
        if (query && query.length > 0) {
            query.forEach((filter) => {
                if ("And" in filter) {
                    // Apply AND conditions by chaining filters
                    filter.And.forEach((subFilter) => {
                        const { column, operator, value } = subFilter;
                        queryBuilder = queryBuilder[operator](column, value);
                    });
                }
                else if ("Or" in filter) {
                    // For OR conditions, we need to use the or() with filter string
                    const orFilters = filter.Or.map((subFilter) => {
                        const { column, operator, value } = subFilter;
                        return `${column}.${operator}.${value}`;
                    }).join(",");
                    queryBuilder = queryBuilder.or(orFilters);
                }
                else {
                    // Handle simple filter
                    const { column, operator, value } = filter;
                    queryBuilder = queryBuilder[operator](column, value);
                }
            });
        }
        if (modifyQuery) {
            const modifiedQuery = modifyQuery(queryBuilder);
            queryBuilder = modifiedQuery;
        }
        const res = await queryBuilder;
        if (res.error)
            throwSupabaseError(res);
        return res;
    }
    /**
     * Insert data into the Supabase database
     * @param {Object} params - The insert parameters
     * @param {string} params.table - The table name
     * @param {T} params.data - The data to insert
     * @param {boolean} [params.selecting=false] - Whether to return the inserted data
     */
    async insertIntoDB({ table, data, selecting = true, }) {
        const baseQuery = this.supabaseClient.from(table).insert(data);
        if (selecting)
            return baseQuery.select();
        const res = await baseQuery;
        if (res.error)
            throwSupabaseError(res);
        return res;
    }
    /**
     * Update a record by ID in the database
     * @param {Object} params - The update parameters
     * @param {string} params.table - The table name
     * @param {string} params.id - The record ID
     * @param {T} params.data - The update data
     */
    async updateById({ table, id, data, }) {
        const res = await this.updateByQuery({
            table,
            data,
            query: [{ column: "id", operator: EQueryOperator.Eq, value: id }],
            single: true,
        });
        return { data: res.data, error: res.error };
    }
    /**
     * Update records by query in the database
     * @param {Object} params - The update parameters
     * @param {string} params.table - The table name
     * @param {T} params.data - The update data
     * @param {QueryFilter[]} params.query - Array of query filters
     */
    async updateByQuery({ table, data, query, single = false, }) {
        let queryBuilder = this.supabaseClient.from(table).update(data);
        query.forEach(({ column, operator, value }) => {
            queryBuilder = queryBuilder[operator](column, value);
        });
        const _query = queryBuilder.select();
        if (single)
            _query.maybeSingle();
        const res = await _query;
        if (res.error)
            throwSupabaseError(res);
        return res;
    }
    /**
     * Delete records by query in the database
     * @param {Object} params - The delete parameters
     * @param {string} params.table - The table name
     * @param {QueryFilter[]} params.query - Array of query filters
     */
    async deleteByQuery({ table, query, single = false, }) {
        let queryBuilder = this.supabaseClient.from(table).delete();
        query.forEach(({ column, operator, value }) => {
            queryBuilder = queryBuilder[operator](column, value);
        });
        const _query = queryBuilder.select();
        if (single)
            _query.maybeSingle();
        const res = await _query;
        if (res.error)
            throwSupabaseError(res);
        return res;
    }
    /**
     * Delete a record by ID from the database
     * @param {Object} params - The delete parameters
     * @param {string} params.table - The table name
     * @param {string} params.id - The record ID
     */
    deleteById({ table, id, single = false, }) {
        return this.deleteByQuery({
            table,
            query: [{ column: "id", operator: EQueryOperator.Eq, value: id }],
            single,
        });
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
    async uploadFile({ bucket, path, base64FileData, mimeType, options = {}, }) {
        const res = await this.supabaseClient.storage
            .from(bucket)
            .upload(path, decode(base64FileData), {
            contentType: mimeType,
            cacheControl: "3600",
            upsert: true,
            ...options,
        });
        if (res.error)
            throwSupabaseError(res);
        return res;
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
    async deleteFile({ bucket, paths }) {
        const res = await this.supabaseClient.storage.from(bucket).remove(paths);
        if (res.error)
            throwSupabaseError(res);
        return res;
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
    async getSignedUrlForDownload({ bucket, path, options = {}, }) {
        const _options = {
            expiresIn: 60,
            ...options,
        };
        const res = await this.supabaseClient.storage
            .from(bucket)
            .createSignedUrl(path, _options?.expiresIn, _options?.transformations || {});
        if (res.error)
            throwSupabaseError(res);
        return res;
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
    async transaction(callback) {
        try {
            // Begin transaction
            await this.supabaseClient.rpc("begin");
            // Execute the callback with transaction
            const result = await callback(this.supabaseClient);
            // Commit transaction
            await this.supabaseClient.rpc("commit");
            return result;
        }
        catch (error) {
            // Rollback transaction on error
            const res = await this.supabaseClient.rpc("rollback");
            throwSupabaseError(error);
        }
    }
    async getSignedUrlForUpload({ bucket, path, options, }) {
        const res = await this.supabaseClient.storage
            .from(bucket)
            .createSignedUploadUrl(path, {
            upsert: true,
            ...options,
        });
        if (res.error)
            throwSupabaseError(res);
        return res;
    }
    async uploadFileToSignedUrl({ bucket, path, base64FileData, mimeType, token, }) {
        const res = await this.supabaseClient.storage
            .from(bucket)
            .uploadToSignedUrl(path, token, decode(base64FileData), {
            contentType: mimeType,
            upsert: true,
        });
        if (res.error)
            throwSupabaseError(res);
        return res;
    }
    async getPublicUrl({ bucket, path, expiresIn = 60, options = {}, }) {
        const res = await this.supabaseClient.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn, options);
        if (res.error)
            throwSupabaseError(res);
        return res;
    }
    async getBulkPublicUrls({ bucket, paths, expiresIn = 60, options = { download: false }, }) {
        const res = await this.supabaseClient.storage
            .from(bucket)
            .createSignedUrls(paths, expiresIn, options);
        if (res.error)
            throwSupabaseError(res);
        return res;
    }
    async executeRpc(name, params) {
        const res = await this.supabaseClient.rpc(name, params);
        if (res.error)
            throwSupabaseError(res);
        return res;
    }
}
export default SupabaseService;
//# sourceMappingURL=index.js.map