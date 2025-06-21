import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

import { Redis } from "https://esm.sh/@upstash/redis@1.35.0";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function joinPath(...parts: string[]) {
  return parts.filter(Boolean).join("/");
}

async function listAllFiles(bucket: string, prefix = ""): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });
  if (error) throw new Error(error.message);

  const files: string[] = [];
  for (const item of data ?? []) {
    if (item.metadata === null) {
      const nestedPrefix = joinPath(prefix, item.name);
      const nested = await listAllFiles(bucket, nestedPrefix);
      files.push(...nested);
    } else {
      files.push(joinPath(prefix, item.name));
    }
  }

  return files;
}

async function cleanupBucket(bucket: string, redis: Redis) {
  const filePaths = await listAllFiles(bucket);
  const existing = new Set(filePaths);

  const { data, error } = await supabase
    .from("Media")
    .select("id, url")
    .eq("storage->>bucket", bucket);

  if (error) throw new Error(error.message);

  const idsToDelete: string[] = [];
  for (const row of data ?? []) {
    if (!existing.has(row.url)) {
      idsToDelete.push(row.id);
    }
  }

  if (idsToDelete.length > 0) {
    console.log(`[INFO]: Found ${idsToDelete.length} files to delete`);
    const { error: delError } = await supabase
      .from("Media")
      .delete()
      .in("id", idsToDelete);
    if (delError) throw new Error(delError.message);
    const pipeline = redis.pipeline();
    idsToDelete.forEach((i) => pipeline.del(`media:${i}`));
    const redisDeleteResult = await pipeline.exec();
    console.log("[DEBUG]", redisDeleteResult);
  }

  return idsToDelete.length;
}

Deno.serve(async (req: Request) => {
  try {
    const data = await req.json();
    const buckets = data.buckets || [];

    console.log(`[INFO]: Buckets to delete file from ${buckets}`);

    if (!buckets.length)
      throw new Error("No buckets found to delete files from.");

    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
    });
    const results: Record<string, number> = {};
    for (const bucket of buckets) {
      console.log(`[INFO]: Checking [${bucket}] files to delete`);

      const count = await cleanupBucket(bucket, redis);
      results[bucket] = count;
      console.log(`[INFO]: [${bucket}] files deleted successfully`);
    }

    console.log(`[INFO]: Function finished with execution`);
    return new Response(JSON.stringify({ deleted: results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as { message?: string })?.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
