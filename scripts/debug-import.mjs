#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT_DIR = process.cwd();
const DEFAULT_INPUT_FILE = './wines_master.json';
const APP_WINE_FIELDS = [
  'name',
  'producer',
  'wine_type',
  'origin',
  'grape',
  'alcohol',
  'comment',
  'image_url',
  'color_value',
  'taste',
  'tags',
  'aromas',
  'scene_retail',
  'scene_restaurant',
];

await loadEnvFile(path.join(ROOT_DIR, '.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL と Supabaseキーが必要です。');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const options = parseArgs(process.argv.slice(2));
const inputPath = path.resolve(ROOT_DIR, options.file);
const rawRows = JSON.parse(await fs.readFile(inputPath, 'utf8'));

if (!Array.isArray(rawRows)) {
  throw new Error('入力JSONはワインデータの配列にしてください。');
}

const wines = rawRows.map((row, index) => normalizeWine(row, index));
const uniqueJanCodes = new Set(wines.map((wine) => wine.jan_code));
let targetWines = wines;

console.log(`入力ファイル: ${inputPath}`);
console.log(`JSON件数: ${wines.length}`);
console.log(`ユニークJAN件数: ${uniqueJanCodes.size}`);
console.log(`実行モード: ${options.mode}`);

if (options.missingOnly) {
  const existingJanCodes = await fetchExistingJanCodes([...uniqueJanCodes]);
  targetWines = wines.filter((wine) => !existingJanCodes.has(wine.jan_code));
  console.log(`未登録行のみを対象: ${targetWines.length}件`);
}

if (options.mode === 'import-all') {
  await importAll(targetWines, options.chunkSize);
  await verifyImportedRows([...uniqueJanCodes]);
} else if (options.mode === 'compare') {
  await compareImportedRows(wines);
} else if (options.mode === 'verify') {
  await verifyImportedRows([...uniqueJanCodes]);
} else {
  await debugRows(targetWines, options.start, options.limit);
}

async function debugRows(allWines, start, limit) {
  const end = Math.min(allWines.length, start + limit);
  const failures = [];
  let successCount = 0;

  console.log(`${start + 1}件目から${end}件目まで、1件ずつupsertします。`);

  for (let index = start; index < end; index += 1) {
    const wine = allWines[index];
    const result = await upsertPayload(wine);

    if (result.error) {
      const failure = {
        index,
        jan_code: wine.jan_code,
        name: wine.name,
        error: serializeError(result.error),
        fieldSummary: summarizeFields(wine),
      };
      failures.push(failure);

      console.error('\n=== UPSERT ERROR ===');
      console.error(JSON.stringify(failure, null, 2));
      await diagnoseFailedRow(wine);

      if (options.stopOnError) break;
    } else {
      successCount += 1;
    }

    if ((index - start + 1) % 25 === 0 || index === end - 1) {
      console.log(`進捗: ${index - start + 1}/${end - start} 成功=${successCount} 失敗=${failures.length}`);
    }
  }

  console.log('\n=== DEBUG SUMMARY ===');
  console.log(`成功: ${successCount}`);
  console.log(`失敗: ${failures.length}`);

  if (failures.length > 0) {
    const reportPath = path.join(ROOT_DIR, 'debug-import-errors.json');
    await fs.writeFile(reportPath, JSON.stringify(failures, null, 2), 'utf8');
    console.log(`エラーレポート: ${reportPath}`);
    process.exitCode = 1;
  }
}

async function diagnoseFailedRow(wine) {
  console.error('\n--- カラム単位診断 ---');

  const minimalResult = await upsertPayload({ jan_code: wine.jan_code });
  if (minimalResult.error) {
    console.error('jan_codeだけでも失敗しました。winesのjan_code制約、または全UPDATEで動くトリガー/関連テーブルが原因候補です。');
    console.error(JSON.stringify(serializeError(minimalResult.error), null, 2));
    return;
  }

  const individuallyFailed = [];

  for (const field of APP_WINE_FIELDS) {
    if (!(field in wine)) continue;

    const result = await upsertPayload({
      jan_code: wine.jan_code,
      [field]: wine[field],
    });

    if (result.error) {
      individuallyFailed.push({
        field,
        value: summarizeValue(wine[field]),
        error: serializeError(result.error),
      });
    }
  }

  if (individuallyFailed.length > 0) {
    console.error('単独送信で失敗したカラム:');
    console.error(JSON.stringify(individuallyFailed, null, 2));
    return;
  }

  console.error('単独カラムでは再現しませんでした。組み合わせまたはトリガー内の連結値を確認します。');
  const cumulativePayload = { jan_code: wine.jan_code };

  for (const field of APP_WINE_FIELDS) {
    if (!(field in wine)) continue;
    cumulativePayload[field] = wine[field];
    const result = await upsertPayload(cumulativePayload);

    if (result.error) {
      console.error(`累積送信で ${field} を加えた時点から失敗しました。`);
      console.error(JSON.stringify({
        addedField: field,
        fields: Object.keys(cumulativePayload),
        value: summarizeValue(wine[field]),
        error: serializeError(result.error),
      }, null, 2));
      return;
    }
  }

  console.error('カラム単位・累積診断では再現しませんでした。バッチ件数依存のstatement trigger等が原因候補です。');
}

async function importAll(allWines, chunkSize) {
  let importedCount = 0;

  for (let start = 0; start < allWines.length; start += chunkSize) {
    const chunk = allWines.slice(start, start + chunkSize);
    const result = await upsertPayload(chunk);

    if (result.error) {
      console.error(`チャンク ${start + 1}-${start + chunk.length} で失敗しました。`);
      console.error(JSON.stringify(serializeError(result.error), null, 2));
      await locateChunkFailure(chunk, start);
      throw new Error('全件upsertを中断しました。上記の失敗行を確認してください。');
    }

    importedCount += chunk.length;
    console.log(`upsert進捗: ${importedCount}/${allWines.length}`);
  }

  console.log(`全件upsert完了: ${importedCount}件`);
}

async function locateChunkFailure(chunk, offset) {
  for (let index = 0; index < chunk.length; index += 1) {
    const wine = chunk[index];
    const result = await upsertPayload(wine);
    if (result.error) {
      console.error(JSON.stringify({
        index: offset + index,
        jan_code: wine.jan_code,
        name: wine.name,
        error: serializeError(result.error),
        fieldSummary: summarizeFields(wine),
      }, null, 2));
      await diagnoseFailedRow(wine);
    }
  }
}

async function verifyImportedRows(janCodes) {
  const foundJanCodes = await fetchExistingJanCodes(janCodes);

  const { count: totalTableCount, error: countError } = await supabase
    .from('wines')
    .select('*', { count: 'exact', head: true });

  if (countError) throw countError;

  const missingJanCodes = janCodes.filter((janCode) => !foundJanCodes.has(janCode));

  console.log('\n=== VERIFY RESULT ===');
  console.log(`JSON内ユニークJAN: ${janCodes.length}`);
  console.log(`DBで確認できたJAN: ${foundJanCodes.size}`);
  console.log(`DB winesテーブル総件数: ${totalTableCount}`);
  console.log(`不足JAN件数: ${missingJanCodes.length}`);

  if (missingJanCodes.length > 0) {
    console.log('不足JAN先頭20件:', missingJanCodes.slice(0, 20));
    process.exitCode = 1;
  }
}

async function fetchExistingJanCodes(janCodes) {
  const foundJanCodes = new Set();
  const verifyChunkSize = 100;

  for (let start = 0; start < janCodes.length; start += verifyChunkSize) {
    const chunk = janCodes.slice(start, start + verifyChunkSize);
    const { data, error } = await supabase
      .from('wines')
      .select('jan_code')
      .in('jan_code', chunk);

    if (error) throw error;
    for (const row of data || []) foundJanCodes.add(String(row.jan_code));
  }

  return foundJanCodes;
}

async function compareImportedRows(expectedWines) {
  const actualRows = new Map();
  const compareChunkSize = 75;

  for (let start = 0; start < expectedWines.length; start += compareChunkSize) {
    const chunk = expectedWines.slice(start, start + compareChunkSize);
    const janCodes = chunk.map((wine) => wine.jan_code);
    const { data, error } = await supabase
      .from('wines')
      .select(APP_WINE_FIELDS.concat('jan_code').join(','))
      .in('jan_code', janCodes);

    if (error) throw error;
    for (const row of data || []) actualRows.set(String(row.jan_code), row);
  }

  const mismatches = [];

  for (const expected of expectedWines) {
    const actual = actualRows.get(expected.jan_code);
    if (!actual) {
      mismatches.push({
        jan_code: expected.jan_code,
        name: expected.name,
        missing: true,
      });
      continue;
    }

    const fields = [];
    for (const field of APP_WINE_FIELDS) {
      if (!sameValue(expected[field], actual[field])) {
        fields.push({
          field,
          expected: expected[field],
          actual: actual[field],
        });
      }
    }

    if (fields.length > 0) {
      mismatches.push({
        jan_code: expected.jan_code,
        name: expected.name,
        fields,
      });
    }
  }

  console.log('\n=== COMPARE RESULT ===');
  console.log(`比較対象: ${expectedWines.length}`);
  console.log(`完全一致: ${expectedWines.length - mismatches.length}`);
  console.log(`不一致または不足: ${mismatches.length}`);

  if (mismatches.length > 0) {
    const reportPath = path.join(ROOT_DIR, 'debug-import-mismatches.json');
    await fs.writeFile(reportPath, JSON.stringify(mismatches, null, 2), 'utf8');
    console.log(`不一致レポート: ${reportPath}`);
    console.log(JSON.stringify(mismatches.slice(0, 20), null, 2));
    process.exitCode = 1;
  }
}

async function upsertPayload(payload) {
  return supabase
    .from('wines')
    .upsert(payload, { onConflict: 'jan_code' });
}

function normalizeWine(rawWine, index) {
  const wineObject = getObject(rawWine);
  const tasteObject = getObject(wineObject.taste);
  const janCode = stringValue(
    wineObject.jan_code
    ?? wineObject.janCode
    ?? wineObject.jan
    ?? wineObject.id
  );

  if (!janCode) throw new Error(`${index + 1}件目にjan_codeがありません。`);

  const wine = {
    jan_code: janCode,
    name: stringValue(wineObject.name),
    producer: stringValue(wineObject.producer),
    wine_type: stringValue(wineObject.wine_type ?? wineObject.type) || '赤',
    origin: stringValue(wineObject.origin),
    grape: stringValue(wineObject.grape),
    alcohol: stringValue(wineObject.alcohol),
    comment: stringValue(wineObject.comment),
    image_url: normalizeImageUrl(wineObject.image_url ?? wineObject.imageUrl),
    color_value: numberValue(wineObject.color_value ?? wineObject.colorValue, 50),
    taste: {
      body: numberValue(tasteObject.body ?? wineObject.body, 3),
      acidity: numberValue(tasteObject.acidity ?? wineObject.acidity, 3),
      tannin: numberValue(tasteObject.tannin ?? wineObject.tannin, 3),
      sweetness: numberValue(tasteObject.sweetness ?? wineObject.sweetness, 3),
    },
    tags: stringArray(wineObject.tags),
    aromas: stringArray(wineObject.aromas),
  };

  if (wineObject.scene_retail) {
    wine.scene_retail = stringValue(wineObject.scene_retail);
  }
  if (wineObject.scene_restaurant) {
    wine.scene_restaurant = stringValue(wineObject.scene_restaurant);
  }

  return wine;
}

function summarizeFields(wine) {
  return Object.fromEntries(
    Object.entries(wine).map(([field, value]) => [field, summarizeValue(value)])
  );
}

function summarizeValue(value) {
  if (typeof value === 'string') {
    return {
      type: 'string',
      length: value.length,
      preview: value.slice(0, 180),
    };
  }

  if (Array.isArray(value)) {
    return {
      type: 'array',
      items: value.length,
      serializedLength: JSON.stringify(value).length,
      maxItemLength: value.reduce(
        (max, item) => Math.max(max, typeof item === 'string' ? item.length : 0),
        0
      ),
      value,
    };
  }

  if (value && typeof value === 'object') {
    return {
      type: 'object',
      serializedLength: JSON.stringify(value).length,
      value,
    };
  }

  return {
    type: typeof value,
    value,
  };
}

function serializeError(error) {
  return {
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    details: error?.details ?? null,
    hint: error?.hint ?? null,
  };
}

function getObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
}

function stringValue(value) {
  return value == null ? '' : String(value).trim();
}

function numberValue(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function stringArray(value) {
  if (Array.isArray(value)) {
    return value.map(stringValue).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(/[、,]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeImageUrl(value) {
  const text = stringValue(value);
  const markdownLink = text.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/i);
  if (markdownLink) return markdownLink[1].trim();
  const url = text.match(/https?:\/\/[^\s)]+/i);
  return url ? url[0].trim() : text;
}

function sameValue(expected, actual) {
  if (Array.isArray(expected)) {
    return JSON.stringify(expected) === JSON.stringify(Array.isArray(actual) ? actual : []);
  }
  if (expected && typeof expected === 'object') {
    return JSON.stringify(sortObjectKeys(expected)) === JSON.stringify(sortObjectKeys(actual || {}));
  }
  return (expected ?? '') === (actual ?? '');
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, sortObjectKeys(value[key])])
  );
}

function parseArgs(args) {
  const options = {
    file: DEFAULT_INPUT_FILE,
    mode: 'debug',
    start: 0,
    limit: Number.POSITIVE_INFINITY,
    chunkSize: 50,
    stopOnError: false,
    missingOnly: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--import-all') options.mode = 'import-all';
    else if (arg === '--compare') options.mode = 'compare';
    else if (arg === '--verify') options.mode = 'verify';
    else if (arg === '--stop-on-error') options.stopOnError = true;
    else if (arg === '--missing-only') options.missingOnly = true;
    else if (arg === '--file') options.file = args[++index];
    else if (arg === '--start') options.start = Math.max(0, Number(args[++index]) - 1);
    else if (arg === '--limit') options.limit = Math.max(1, Number(args[++index]));
    else if (arg === '--chunk-size') options.chunkSize = Math.max(1, Number(args[++index]));
  }

  return options;
}

async function loadEnvFile(filePath) {
  try {
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
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
