#!/usr/bin/env node

import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

await loadEnvFile('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です。');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const rows = await fetchAllRows();
const fieldNames = [...new Set(rows.flatMap((row) => Object.keys(row)))].sort();
const report = {
  count: rows.length,
  fieldNames,
  wineTypes: countValues(rows, 'wine_type', 20),
  origins: countValues(rows, 'origin', 100),
  grapes: countValues(rows, 'grape', 100),
  priceFields: fieldNames.filter((field) => /price|価格/i.test(field)),
  priceStats: summarizePrices(rows),
  namesByOrigin: groupNamesByOrigin(rows),
  sample: rows.slice(0, 10),
};

await fs.writeFile('wine-inspection-report.json', JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify({
  count: report.count,
  fieldNames: report.fieldNames,
  wineTypes: report.wineTypes,
  priceFields: report.priceFields,
  priceStats: report.priceStats,
  topOrigins: report.origins.slice(0, 30),
  topGrapes: report.grapes.slice(0, 30),
}, null, 2));

async function fetchAllRows() {
  const result = [];
  const pageSize = 500;

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase
      .from('wines')
      .select('*')
      .order('jan_code', { ascending: true })
      .range(start, start + pageSize - 1);

    if (error) throw error;
    result.push(...(data || []));
    if (!data || data.length < pageSize) return result;
  }
}

function countValues(rows, field, limit) {
  const counts = new Map();
  for (const row of rows) {
    const value = String(row[field] ?? '').trim() || '(empty)';
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'ja'))
    .slice(0, limit);
}

function summarizePrices(rows) {
  const values = rows
    .map((row) => Number(row.bottle_price))
    .filter((value) => Number.isFinite(value) && value > 0);

  return {
    populated: values.length,
    missing: rows.length - values.length,
    min: values.length > 0 ? Math.min(...values) : null,
    max: values.length > 0 ? Math.max(...values) : null,
  };
}

function groupNamesByOrigin(rows) {
  const groups = new Map();
  for (const row of rows) {
    const origin = String(row.origin ?? '').trim() || '(empty)';
    if (!groups.has(origin)) groups.set(origin, []);
    groups.get(origin).push({
      jan_code: row.jan_code,
      name: row.name,
      wine_type: row.wine_type,
      bottle_price: row.bottle_price,
    });
  }

  return Object.fromEntries(
    [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
  );
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
