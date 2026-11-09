import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

function dbEnv(key) {
  const u = new URL(process.env[key]);
  return {
    ...process.env,
    PGHOST: u.hostname,
    PGPORT: u.port,
    PGDATABASE: u.pathname.slice(1),
    PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password),
    PGSSLMODE: "require",
    PGCONNECT_TIMEOUT: "15",
  };
}
const oldEnv = dbEnv("OLD_SUPABASE_DB_URL"),
  newEnv = dbEnv("NEW_SUPABASE_DB_URL");
if (oldEnv.PGUSER === newEnv.PGUSER)
  throw Error("Source and destination must differ");
function run(program, args, env) {
  const r = spawnSync(program, args, {
    env,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
    timeout: 180000,
  });
  if (r.status !== 0)
    throw Error(
      `${program} failed: ${(r.stderr || r.error?.message || "").slice(0, 1000)}`,
    );
  return r.stdout;
}
function query(sql, env) {
  return run(
    "psql",
    ["-X", "-w", "-v", "ON_ERROR_STOP=1", "-Atc", sql],
    env,
  ).trim();
}
const mode = process.argv[2] || "audit";
if (mode === "audit") {
  const rows = JSON.parse(
    query(
      "select coalesce(json_agg(json_build_object('name',name,'bucket',bucket_id,'metadata',metadata)),'[]') from storage.objects",
      oldEnv,
    ),
  );
  fs.mkdirSync(".env.migration-work", { recursive: true, mode: 0o700 });
  fs.writeFileSync(".env.migration-work/objects.json", JSON.stringify(rows), {
    mode: 0o600,
  });
  const first = rows[0];
  if (first) {
    const r = await fetch(
      `https://llqztfcmwrwmwvthurqp.supabase.co/storage/v1/object/public/${first.bucket}/${first.name}`,
      { method: "HEAD" },
    );
    console.log(
      JSON.stringify({
        storageFiles: rows.length,
        sourceBytes: rows.reduce(
          (n, r) => n + Number(r.metadata?.size || 0),
          0,
        ),
        sampleImageStatus: r.status,
      }),
    );
  }
} else if (mode === "database") {
  const count = Number(
    query("select count(*) from pg_tables where schemaname='public'", newEnv),
  );
  const users = Number(query("select count(*) from auth.users", newEnv));
  if (count || users)
    throw Error("Destination is not empty; refusing to overwrite it");
  const backup = fs.mkdtempSync(path.join(os.tmpdir(), "carry-migration-"));
  fs.chmodSync(backup, 0o700);
  console.log("Private backup folder: " + backup);
  for (const [name, args] of [
    ["public-schema.sql", ["--schema-only", "--schema=public"]],
    ["public-data.sql", ["--data-only", "--schema=public"]],
    [
      "auth-data.sql",
      [
        "--data-only",
        "--column-inserts",
        "--table=auth.users",
        "--table=auth.identities",
      ],
    ],
  ]) {
    run(
      "pg_dump",
      [
        "--no-owner",
        "--no-password",
        ...args,
        "--file",
        path.join(backup, name),
      ],
      oldEnv,
    );
    fs.chmodSync(path.join(backup, name), 0o600);
  }
  // The managed destination already has its public schema.
  const schema = path.join(backup, "public-schema.sql");
  fs.writeFileSync(
    schema,
    fs
      .readFileSync(schema, "utf8")
      .replace(/^CREATE SCHEMA public;\r?\n/m, "")
      .replace(
        /^ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin .*;\r?\n/gm,
        "",
      ),
  );
  run(
    "psql",
    [
      "-X",
      "-w",
      "-v",
      "ON_ERROR_STOP=1",
      "--single-transaction",
      "-f",
      schema,
      "-c",
      "SET session_replication_role = replica",
      "-f",
      path.join(backup, "auth-data.sql"),
      "-f",
      path.join(backup, "public-data.sql"),
      "-c",
      "SET session_replication_role = origin",
    ],
    newEnv,
  );
  run(
    "psql",
    [
      "-X",
      "-w",
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      "supabase/migrations/0014_disable_order_auto_cancellation.sql",
    ],
    newEnv,
  );
  console.log(
    query(
      "select json_build_object('products',(select count(*) from public.products),'orders',(select count(*) from public.orders),'users',(select count(*) from auth.users),'roles',(select count(*) from public.roles))",
      newEnv,
    ),
  );
  console.log("Database restore complete; source untouched.");
} else if (mode === "storage") {
  const destination = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const { data: buckets, error: bucketError } =
    await destination.storage.listBuckets();
  if (bucketError) throw bucketError;
  if (!buckets.some((b) => b.id === "product-images")) {
    const { error } = await destination.storage.createBucket("product-images", {
      public: true,
      fileSizeLimit: 26214400,
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
        "image/gif",
      ],
    });
    if (error) throw error;
  }
  const rows = JSON.parse(
    fs.readFileSync(".env.migration-work/objects.json", "utf8"),
  );
  const directory = ".env.migration-work/images";
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const results = [];
  for (const [index, row] of rows.entries()) {
    const source = `https://llqztfcmwrwmwvthurqp.supabase.co/storage/v1/object/public/${row.bucket}/${row.name}`;
    let response = await fetch(source);
    let recoveredFrom = "original";
    if (!response.ok) {
      // Only request public image variants already used by this storefront.
      for (const width of [1080, 640, 256]) {
        response = await fetch(
          `https://e-com-pearl-seven.vercel.app/_next/image?url=${encodeURIComponent(source)}&w=${width}&q=75`,
        );
        if (
          response.ok &&
          response.headers.get("content-type")?.startsWith("image/")
        ) {
          recoveredFrom = `Vercel optimized ${width}px`;
          break;
        }
      }
    }
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/")
    ) {
      results.push({ name: row.name, ok: false, status: response.status });
      console.log(`Image ${index + 1}/${rows.length}: source unavailable`);
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(path.join(directory, `${index}.image`), bytes, {
      mode: 0o600,
    });
    const { error } = await destination.storage
      .from(row.bucket)
      .upload(row.name, bytes, {
        contentType: response.headers.get("content-type").split(";")[0],
        cacheControl: "31536000",
        upsert: false,
      });
    if (error && !error.message.toLowerCase().includes("already exists"))
      throw error;
    results.push({
      name: row.name,
      ok: true,
      bytes: bytes.length,
      recoveredFrom,
    });
    console.log(`Image ${index + 1}/${rows.length}: copied (${recoveredFrom})`);
  }
  fs.writeFileSync(
    ".env.migration-work/image-results.json",
    JSON.stringify(results, null, 2),
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      copied: results.filter((r) => r.ok).length,
      unavailable: results.filter((r) => !r.ok).length,
    }),
  );
} else if (mode === "recover-local-images") {
  const rows = JSON.parse(
    fs.readFileSync(".env.migration-work/objects.json", "utf8"),
  );
  const results = JSON.parse(
    fs.readFileSync(".env.migration-work/image-results.json", "utf8"),
  );
  const candidates = new Map();
  const cache = ".next/dev/cache/images";
  for (const dir of fs.readdirSync(cache)) {
    const root = path.join(cache, dir);
    if (!fs.statSync(root).isDirectory()) continue;
    for (const name of fs.readdirSync(root)) {
      const etag = Buffer.from(
        name.split(".")[3] || "",
        "base64url",
      ).toString();
      if (!rows.some((r) => r.metadata?.eTag === etag)) continue;
      const file = path.join(root, name);
      try {
        const m = await sharp(file).metadata();
        const area = (m.width || 0) * (m.height || 0);
        if (area > (candidates.get(etag)?.area || 0))
          candidates.set(etag, {
            file,
            area,
            width: m.width,
            height: m.height,
          });
      } catch {}
    }
  }
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  for (const row of rows) {
    const existing = results.find((r) => r.name === row.name);
    if (existing?.ok) continue;
    const candidate = candidates.get(row.metadata?.eTag);
    if (!candidate) continue;
    const bytes = await sharp(candidate.file).webp({ quality: 85 }).toBuffer();
    const { error } = await client.storage
      .from(row.bucket)
      .upload(row.name, bytes, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
    if (error && !error.message.toLowerCase().includes("already exists"))
      throw error;
    Object.assign(existing, {
      ok: true,
      bytes: bytes.length,
      recoveredFrom: "local optimized cache",
      width: candidate.width,
      height: candidate.height,
    });
    console.log(
      `Recovered cached image (${candidate.width} × ${candidate.height})`,
    );
  }
  fs.writeFileSync(
    ".env.migration-work/image-results.json",
    JSON.stringify(results, null, 2),
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({
      copied: results.filter((r) => r.ok).length,
      unavailable: results.filter((r) => !r.ok).length,
    }),
  );
} else if (mode === "storage-policies") {
  run(
    "psql",
    [
      "-X",
      "-w",
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      "supabase/migrations/0002_storage.sql",
    ],
    newEnv,
  );
  console.log("Public image reads and admin-only uploads configured.");
} else if (mode === "smoke") {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } },
  );
  const { data: users, error: userError } = await admin.auth.admin.listUsers();
  if (userError) throw userError;
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: users.users[0].email,
  });
  if (linkError) throw linkError;
  const { error: loginError } = await client.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: "magiclink",
  });
  if (loginError) throw loginError;
  const { count, error } = await client
    .from("orders")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count !== 46) throw Error("Admin cannot read all migrated orders");
  console.log("Authenticated admin session can access all 46 migrated orders.");
  await client.auth.signOut();
  const sql = `begin;
  select set_config('request.jwt.claim.role','service_role',true);
  do $$ declare p public.products%rowtype; w public.delivery_fees%rowtype; c integer; result jsonb; amount integer;
  begin
    select * into p from public.products where is_active and stock_quantity-reserved_quantity>0 limit 1 for update;
    select * into w from public.delivery_fees where home_available limit 1;
    select id into c from public.communes where wilaya_code=w.wilaya_code limit 1;
    update public.products set offers=jsonb_build_array(jsonb_build_object('qty',1,'price',p.price,'free_delivery',true)) where id=p.id;
    result:=public.create_order('Migration test','0500000000',w.wilaya_code,c,'Test','home',jsonb_build_array(jsonb_build_object('product_id',p.id,'quantity',1)));
    select delivery_fee into amount from public.orders where id=(result->>'order_id')::uuid;
    if amount<>0 then raise exception 'Single-piece free delivery failed'; end if;
    select total into amount from public.orders where id=(result->>'order_id')::uuid;
    if amount<>p.price then raise exception 'Checkout total mismatch'; end if;
  end $$;
  rollback;`;
  query(sql, newEnv);
  console.log(
    "Checkout and one-piece free delivery verified; test order rolled back.",
  );
} else if (mode === "finalize") {
  query("alter publication supabase_realtime add table public.orders", newEnv);
  const identitySql =
    "select md5(coalesce(string_agg(id::text || coalesce(encrypted_password,''), ',' order by id),'')) from auth.users";
  if (query(identitySql, oldEnv) !== query(identitySql, newEnv))
    throw Error("Login data mismatch");
  for (const table of [
    "orders",
    "order_items",
    "stock_movements",
    "profiles",
    "roles",
    "delivery_fees",
    "communes",
    "wilayas",
    "checkout_leads",
  ]) {
    const sql = `select md5(coalesce(string_agg(row_to_json(t)::text, '' order by row_to_json(t)::text),'')) from public.${table} t`;
    if (query(sql, oldEnv) !== query(sql, newEnv))
      throw Error(`Data mismatch: ${table}`);
    console.log(`${table}: full data matched`);
  }
  console.log(
    "Login password hashes matched; live order notifications enabled.",
  );
} else if (mode === "verify") {
  const tables = JSON.parse(
    query(
      "select json_agg(tablename) from pg_tables where schemaname='public'",
      oldEnv,
    ),
  );
  for (const table of tables) {
    if (!/^[a-z_]+$/.test(table)) throw Error("Unexpected table name");
    const sql = `select count(*) from public.${table}`;
    const oldCount = query(sql, oldEnv),
      newCount = query(sql, newEnv);
    console.log(
      `${table}: ${oldCount === newCount ? "matched" : "MISMATCH"} (${oldCount}/${newCount})`,
    );
    if (oldCount !== newCount) throw Error("Row count mismatch");
  }
  const count = query("select count(*) from auth.users", newEnv);
  console.log(`Admin users restored: ${count}`);
} else {
  throw Error("Unknown migration mode");
}
