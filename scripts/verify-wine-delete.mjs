#!/usr/bin/env node

import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

await loadEnvFile('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY、SUPABASE_SERVICE_ROLE_KEY が必要です。'
  );
}

const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const testJanCode = `DELETE-VERIFY-${suffix}`;
const useServiceRoleForDelete = process.argv.includes('--service-role-delete');
let testWineId = null;
let testStoreId = null;

try {
  const { data: store, error: storeError } = await serviceClient
    .from('stores')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (storeError) throw storeError;
  testStoreId = store?.id ?? null;

  const { data: wine, error: wineError } = await serviceClient
    .from('wines')
    .insert({
      jan_code: testJanCode,
      name: `削除検証用ワイン ${suffix}`,
      producer: '削除検証用',
      wine_type: '赤',
    })
    .select('id, jan_code')
    .single();

  if (wineError) throw wineError;
  testWineId = wine.id;

  await insertOrThrow('store_inventory', {
    store_id: testStoreId,
    jan_code: testJanCode,
    bottle_price: 1000,
    glass_price: 500,
  });
  await insertOrThrow('wine_comments', {
    store_id: testStoreId,
    jan_code: testJanCode,
    nickname: 'delete-verifier',
    comment: '削除検証用コメント',
    is_approved: false,
  });
  await insertOrThrow('dishes', {
    store_id: testStoreId,
    name: `削除検証用料理 ${suffix}`,
    pairing_wine_id: testWineId,
  });
  await insertOrThrow('retail_menu_tags', {
    store_id: testStoreId,
    category_name: '削除検証',
    tag_name: `削除検証用タグ ${suffix}`,
    pairing_wine_id: testWineId,
  });

  const deleteClient = useServiceRoleForDelete ? serviceClient : anonClient;
  const { data: deletedRows, error: deleteError } = await deleteClient
    .from('wines')
    .delete()
    .eq('id', testWineId)
    .select('id');

  const parentExists = await rowExists('wines', 'id', testWineId);
  const childCounts = {
    store_inventory: await countRows('store_inventory', 'jan_code', testJanCode),
    wine_comments: await countRows('wine_comments', 'jan_code', testJanCode),
    dishes: await countRows('dishes', 'pairing_wine_id', testWineId),
    retail_menu_tags: await countRows('retail_menu_tags', 'pairing_wine_id', testWineId),
  };

  const report = {
    deleteRole: useServiceRoleForDelete ? 'service_role' : 'anon',
    deleteError: deleteError
      ? {
          code: deleteError.code,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint,
        }
      : null,
    deletedRows: deletedRows?.length ?? 0,
    parentExists,
    childCounts,
    rlsDeleteAllowed: !deleteError && !parentExists,
    cascadeDeleteWorking:
      !parentExists && Object.values(childCounts).every(count => count === 0),
  };

  console.log(JSON.stringify(report, null, 2));

  if (!report.rlsDeleteAllowed || !report.cascadeDeleteWorking) {
    process.exitCode = 1;
  }
} finally {
  await cleanupTestData();
}

async function insertOrThrow(table, row) {
  const { error } = await serviceClient.from(table).insert(row);
  if (error) {
    throw new Error(
      `${table} の検証データ作成に失敗しました: ${error.code || ''} ${error.message}`
    );
  }
}

async function rowExists(table, column, value) {
  const { count, error } = await serviceClient
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value);

  if (error) throw error;
  return (count ?? 0) > 0;
}

async function countRows(table, column, value) {
  const { count, error } = await serviceClient
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value);

  if (error) throw error;
  return count ?? 0;
}

async function cleanupTestData() {
  const cleanupTargets = [
    ['retail_menu_tags', 'pairing_wine_id', testWineId],
    ['dishes', 'pairing_wine_id', testWineId],
    ['wine_comments', 'jan_code', testJanCode],
    ['store_inventory', 'jan_code', testJanCode],
    ['wines', 'id', testWineId],
  ];

  for (const [table, column, value] of cleanupTargets) {
    if (!value) continue;
    const { error } = await serviceClient.from(table).delete().eq(column, value);
    if (error) {
      console.error(
        `検証データのクリーンアップに失敗しました (${table}): ${error.message}`
      );
    }
  }
}

async function loadEnvFile(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}
