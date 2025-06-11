import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const buckets = (Deno.env.get("CLEANUP_BUCKETS") ?? "").split(",").map(b => b.trim()).filter(Boolean);

function joinPath(...parts: string[]) {
  return parts.filter(Boolean).join("/");
}

async function listAllFiles(bucket: string, prefix = ""): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
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

async function cleanupBucket(bucket: string) {
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
    const { error: delError } = await supabase.from("Media").delete().in("id", idsToDelete);
    if (delError) throw new Error(delError.message);
  }

  return idsToDelete.length;
}

Deno.serve(async () => {
  try {
    const results: Record<string, number> = {};
    for (const bucket of buckets) {
      const count = await cleanupBucket(bucket);
      results[bucket] = count;
    }
    return new Response(JSON.stringify({ deleted: results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
