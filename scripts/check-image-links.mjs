#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const [, , inputFile] = process.argv;
const CONCURRENCY = Number(process.env.IMAGE_CHECK_CONCURRENCY || 8);
const TIMEOUT_MS = Number(process.env.IMAGE_CHECK_TIMEOUT_MS || 10000);

if (!inputFile || inputFile === '-h' || inputFile === '--help') {
  printUsage();
  process.exit(inputFile ? 0 : 1);
}

try {
  const inputPath = path.resolve(process.cwd(), inputFile);
  const raw = await fs.readFile(inputPath, 'utf8');
  const wines = loadWineRows(raw, inputPath).map(normalizeWineRow);
  const checkTargets = wines.filter((wine) => wine.imageUrl);

  if (checkTargets.length === 0) {
    console.log('image_url を持つワインが見つかりませんでした。');
    process.exit(0);
  }

  console.log(`画像URLを検証中: ${checkTargets.length}件`);
  const results = await mapLimit(checkTargets, CONCURRENCY, checkImageUrl);
  const brokenLinks = results.filter((result) => result.status === 404);
  const otherFailures = results.filter(
    (result) => !result.ok && result.status !== 404
  );

  if (brokenLinks.length === 0) {
    console.log('404の画像リンク切れは見つかりませんでした。');
  } else {
    console.log(`404の画像リンク切れ: ${brokenLinks.length}件`);
    console.table(
      brokenLinks.map((result) => ({
        jan_code: result.janCode,
        name: result.name,
        status: result.status,
        image_url: result.imageUrl,
      }))
    );
  }

  if (otherFailures.length > 0) {
    console.log('404以外の確認不能またはHTTPエラー:');
    console.table(
      otherFailures.map((result) => ({
        jan_code: result.janCode,
        name: result.name,
        status: result.status ?? 'ERROR',
        message: result.message || '',
        image_url: result.imageUrl,
      }))
    );
  }

  process.exitCode = brokenLinks.length > 0 ? 1 : 0;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}

function printUsage() {
  console.log(`Usage:
  node scripts/check-image-links.mjs <wines.json|wines.csv>

Env:
  IMAGE_CHECK_CONCURRENCY=8
  IMAGE_CHECK_TIMEOUT_MS=10000`);
}

function loadWineRows(raw, inputPath) {
  const ext = path.extname(inputPath).toLowerCase();

  if (ext === '.csv') {
    return parseCsv(raw);
  }

  const parsed = JSON.parse(stripBom(raw));

  if (Array.isArray(parsed)) {
    return parsed;
  }

  for (const key of ['wines', 'data', 'items', 'rows']) {
    if (Array.isArray(parsed?.[key])) {
      return parsed[key];
    }
  }

  if (parsed && typeof parsed === 'object') {
    const values = Object.values(parsed);
    if (values.every((value) => value && typeof value === 'object')) {
      return values;
    }
  }

  throw new Error('JSONは配列、または wines/data/items/rows の配列プロパティを持つ形式にしてください。');
}

function normalizeWineRow(row) {
  const janCode = stringValue(
    row.jan_code ?? row.janCode ?? row.jan ?? row.JAN ?? row.id
  );

  return {
    janCode,
    name: stringValue(row.name ?? row.product_name ?? row.productName ?? row['商品名']),
    imageUrl: normalizeImageUrl(row.image_url ?? row.imageUrl ?? row.image ?? row['画像URL']),
  };
}

function normalizeImageUrl(value) {
  const text = stringValue(value);
  if (!text) return '';

  const markdownLink = text.match(/^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/i);
  if (markdownLink) return markdownLink[1].trim();

  const url = text.match(/https?:\/\/[^\s)]+/i);
  return url ? url[0].trim() : text;
}

function stringValue(value) {
  return value == null ? '' : String(value).trim();
}

async function checkImageUrl(wine) {
  let response = await requestImage(wine.imageUrl, 'HEAD');

  if (response.status === 403 || response.status === 405 || response.status === 501) {
    response = await requestImage(wine.imageUrl, 'GET');
  }

  return {
    ...wine,
    ...response,
  };
}

async function requestImage(url, method) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      message: response.statusText,
      method,
      imageUrl: url,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      message: error instanceof Error ? error.message : String(error),
      method,
      imageUrl: url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(Math.max(limit, 1), items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}

function parseCsv(raw) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const text = stripBom(raw);

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  row.push(field);
  rows.push(row);

  const [headerRow, ...dataRows] = rows.filter((record) =>
    record.some((cell) => cell.trim() !== '')
  );

  if (!headerRow) return [];

  const headers = headerRow.map((header) => header.trim());
  return dataRows.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? '']))
  );
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, '');
}
