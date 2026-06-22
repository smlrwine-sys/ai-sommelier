#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const APPLY_CHANGES = process.argv.includes('--apply');
const SKIP_IMAGES = process.argv.includes('--skip-images');
const UPDATE_CHUNK_SIZE = 50;
const IMAGE_CONCURRENCY = 12;
const IMAGE_TIMEOUT_MS = 12000;

const AROMA_REFERENCE = new Set([
  'インク', 'ブラックチェリー', 'ブラックベリー', 'フランボワーズ', 'バナナ',
  'パイナップル', '洋ナシ', 'アプリコット', '花梨', 'ライチ', 'メロン',
  'マンゴー', '胡椒', 'ピーマン', 'タール', 'ハーブ', '革', '樽',
  'タバコ', 'ミント', 'オレンジの皮', 'ドライフルーツ', 'プルーン',
  'カシス', 'プラム', 'スミレ', 'チェリー', 'トリュフ', 'チョコレート',
  'リコリス', 'ローズ', 'きのこ', 'スパイス', 'イチゴ', 'ハチミツ',
  'モカ', '青リンゴ', 'レモン', '貝殻（ミネラル）', '白桃', 'ナッツ',
  'アカシアの花', '金木犀', 'バニラ', 'グレープフルーツ', 'レッドカラント',
]);

const VALID_RETAIL_SCENES = new Set(['家飲み', '自分へのご褒美', 'ギフト', '記念日']);
const VALID_RESTAURANT_SCENES = new Set(['軽く一杯', 'しっかり食事', '接待・ビジネス', 'デート・記念日']);

const EXPLICIT_GRAPE_RULES = [
  [/カベルネ[・\s]?ソーヴィニ[ヨョ]ン/i, 'カベルネ・ソーヴィニヨン'],
  [/カベルネ[・\s]?フラン/i, 'カベルネ・フラン'],
  [/ソーヴィニ[ヨョ]ン[・\s]?ブラン/i, 'ソーヴィニヨン・ブラン'],
  [/ピノ[・\s]?(?:ノワール|ノワ|ネロ)|シュペートブルグンダー/i, 'ピノ・ノワール'],
  [/シャルドネ/i, 'シャルドネ'],
  [/メルロ/i, 'メルロ'],
  [/プティ[・\s]?シラー/i, 'プティ・シラー'],
  [/シラーズ|シラー/i, 'シラー'],
  [/グルナッシュ[・\s]?ブラン/i, 'グルナッシュ・ブラン'],
  [/グルナッシュ|ガルナッチャ/i, 'グルナッシュ'],
  [/ムールヴェードル|モナストレル/i, 'ムールヴェードル'],
  [/マルベック/i, 'マルベック'],
  [/テンプラニ[ー]?リョ|テンプラニーリョ/i, 'テンプラニーリョ'],
  [/グラシアーノ/i, 'グラシアーノ'],
  [/ヴィウラ|ビウラ/i, 'ヴィウラ'],
  [/リースリング|リズリング/i, 'リースリング'],
  [/ゲヴュルツトラミネール|トラミネッツ|トラミナー/i, 'ゲヴュルツトラミネール'],
  [/ピノ[・\s]?(?:グリ|グリージョ)|シビ[・\s]?ピノ/i, 'ピノ・グリ'],
  [/シュナン[・\s]?ブラン/i, 'シュナン・ブラン'],
  [/セミヨン/i, 'セミヨン'],
  [/ヴィオニエ/i, 'ヴィオニエ'],
  [/ミュスカ|モスカート|ジビッボ/i, 'ミュスカ'],
  [/アリゴテ/i, 'アリゴテ'],
  [/ガメイ|ボジョレー/i, 'ガメイ'],
  [/ネッビオーロ|バローロ|バルバレスコ/i, 'ネッビオーロ'],
  [/バルベーラ/i, 'バルベーラ'],
  [/コルテーゼ|ガヴィ/i, 'コルテーゼ'],
  [/アルネイス/i, 'アルネイス'],
  [/ペラヴェルガ/i, 'ペラヴェルガ'],
  [/モンテプルチアーノ/i, 'モンテプルチアーノ'],
  [/ペコリーノ/i, 'ペコリーノ'],
  [/ココッチオーラ/i, 'ココッチオーラ'],
  [/パッセリーナ/i, 'パッセリーナ'],
  [/プロセッコ|プロ[・\s]?シック/i, 'グレーラ'],
  [/ソアーヴェ|ガルガネガ/i, 'ガルガネガ'],
  [/アマローネ|ヴァルポリチェッラ/i, 'コルヴィーナ主体'],
  [/ネロ[・\s]?ダヴォラ/i, 'ネロ・ダヴォラ'],
  [/グリッロ/i, 'グリッロ'],
  [/フィアーノ/i, 'フィアーノ'],
  [/プリミティーヴォ/i, 'プリミティーヴォ'],
  [/アリアニコ/i, 'アリアニコ'],
  [/サンジョヴェーゼ|キャンティ|キアンティ/i, 'サンジョヴェーゼ'],
  [/カナイオーロ/i, 'カナイオーロ'],
  [/フリウラーノ/i, 'フリウラーノ'],
  [/ラクリマ/i, 'ラクリマ'],
  [/アルバリーニョ/i, 'アルバリーニョ'],
  [/フルミント/i, 'フルミント'],
  [/バッカス/i, 'バッカス'],
  [/ジンファンデル/i, 'ジンファンデル'],
  [/ピノタージュ/i, 'ピノタージュ'],
  [/グリューナー[・\s]?ヴェルトリーナー/i, 'グリューナー・ヴェルトリーナー'],
  [/ドルチェット/i, 'ドルチェット'],
  [/ウーヴァ[・\s]?ディ[・\s]?トロイア/i, 'ウーヴァ・ディ・トロイア'],
  [/カルメネール/i, 'カルメネール'],
  [/マルサンヌ/i, 'マルサンヌ'],
  [/ルーサンヌ/i, 'ルーサンヌ'],
  [/トレッビアーノ/i, 'トレッビアーノ'],
  [/マカベオ/i, 'マカベオ'],
  [/アイレン/i, 'アイレン'],
];

await loadEnvFile('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です。');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const rows = await fetchAllWines();
const rebuilt = rows.map(rebuildWine);
makeGeneratedCommentsUnique(rebuilt);
ensureGlobalCommentUniqueness(rebuilt);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const summary = buildSummary(rows, rebuilt);

await fs.writeFile(
  'wine-update-preview.json',
  JSON.stringify(rebuilt.map(({ update }) => update), null, 2),
  'utf8'
);
await fs.writeFile(
  'wine-update-quality-report.json',
  JSON.stringify(summary, null, 2),
  'utf8'
);
await fs.writeFile(
  'wine-update-low-confidence.json',
  JSON.stringify(
    rebuilt
      .filter((item) => item.meta.confidence < 0.75)
      .map((item) => ({
        jan_code: item.update.jan_code,
        name: item.meta.original.name,
        origin: item.meta.original.origin,
        wine_type: item.meta.original.wine_type,
        inferred_grape: item.update.grape,
        confidence: item.meta.confidence,
        source: item.meta.source,
      })),
    null,
    2
  ),
  'utf8'
);

console.log(JSON.stringify(summary.consoleSummary, null, 2));

if (!APPLY_CHANGES) {
  console.log('ドライラン完了。DB更新には --apply を付けて実行してください。');
  process.exit(0);
}

await fs.writeFile(
  `wine-backup-${timestamp}.json`,
  JSON.stringify(rows, null, 2),
  'utf8'
);

const imagePromise = SKIP_IMAGES
  ? Promise.resolve([])
  : checkAllImages(rows);

await updateAllWines(rebuilt.map(({ update }) => update));
const imageErrors = await imagePromise;

await fs.writeFile(
  'wine-image-errors.json',
  JSON.stringify(imageErrors, null, 2),
  'utf8'
);
await fs.writeFile(
  'wine-image-error-jans.txt',
  imageErrors.map((item) => item.jan_code).join('\n') + (imageErrors.length ? '\n' : ''),
  'utf8'
);

const verification = await verifyUpdates(rebuilt);
await fs.writeFile(
  'wine-update-verification.json',
  JSON.stringify(verification, null, 2),
  'utf8'
);

console.log('\n=== UPDATE COMPLETE ===');
console.log(`DB更新件数: ${rebuilt.length}`);
console.log(`完全一致件数: ${verification.matched}`);
console.log(`不一致件数: ${verification.mismatches.length}`);
console.log(`画像エラー件数: ${imageErrors.length}`);
console.log('画像エラーJAN:', imageErrors.map((item) => item.jan_code));

if (verification.mismatches.length > 0) {
  process.exitCode = 1;
}

async function fetchAllWines() {
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

function rebuildWine(wine) {
  const name = normalizeText(wine.name);
  const origin = normalizeText(wine.origin);
  const wineType = normalizeWineType(wine.wine_type, name, origin);

  if (isNonWineProduct(name)) {
    return {
      update: {
        id: wine.id,
        jan_code: String(wine.jan_code).trim(),
        grape: wine.grape,
        aromas: Array.isArray(wine.aromas) ? wine.aromas : [],
        taste: wine.taste || { body: 3, acidity: 3, tannin: 3, sweetness: 2 },
        color_value: wine.color_value,
        pairing_food: String(wine.pairing_food ?? ''),
        comment: String(wine.comment ?? ''),
        scene_retail: wine.scene_retail,
        scene_restaurant: wine.scene_restaurant,
        tags: Array.isArray(wine.tags) ? wine.tags : [],
      },
      meta: {
        confidence: 0,
        source: 'non-wine-product-preserved',
        sceneSource: 'preserved',
        skipped: true,
        original: wine,
      },
    };
  }

  const inference = inferGrape({ name, origin, wineType, currentGrape: wine.grape });
  const taste = inferTaste({ name, origin, wineType, grape: inference.grape });
  const aromas = inferAromas({
    name,
    origin,
    wineType,
    grape: inference.grape,
    seed: wine.jan_code,
  });
  const pairingFood = inferPairingFood({
    name,
    origin,
    wineType,
    grape: inference.grape,
    seed: wine.jan_code,
  }).join('、');
  const colorValue = inferColorValue(wineType, taste);
  const scenes = inferScenes(wine);
  const tags = buildTags(taste);
  const comment = buildComment({
    name: normalizeText(wine.name) || 'このワイン',
    origin: origin || '産地',
    wineType,
    grape: inference.grape,
    aromas,
    taste,
    pairings: pairingFood.split('、'),
    seed: wine.jan_code,
  });

  return {
    update: {
      id: wine.id,
      jan_code: String(wine.jan_code).trim(),
      grape: inference.grape,
      aromas,
      taste,
      color_value: colorValue,
      pairing_food: pairingFood,
      comment,
      scene_retail: scenes.sceneRetail,
      scene_restaurant: scenes.sceneRestaurant,
      tags,
    },
    meta: {
      confidence: inference.confidence,
      source: inference.source,
      sceneSource: scenes.source,
      original: wine,
    },
  };
}

function inferGrape({ name, origin, wineType, currentGrape }) {
  const explicitMatches = [];
  for (const [pattern, grape] of EXPLICIT_GRAPE_RULES) {
    if (pattern.test(name)) explicitMatches.push(grape);
  }

  if (explicitMatches.length > 0) {
    return {
      grape: unique(explicitMatches).join('、'),
      confidence: 0.99,
      source: 'name',
    };
  }

  if (
    wineType === '白'
    && /ソーヴィニ[ヨョ]ン(?:$|[・\s])/.test(name)
    && !/カベルネ/.test(name)
  ) {
    return result('ソーヴィニヨン・ブラン', 0.96, 'name');
  }

  if (/ブルゴーニュ|ボージョレ/.test(origin)) {
    if (/ボージョレ|ヌーヴォー/.test(name + origin)) {
      return result('ガメイ', 0.98, 'appellation');
    }
    if (wineType === '赤' || wineType === 'ロゼ') {
      return result('ピノ・ノワール', 0.96, 'region-type');
    }
    if (wineType === '泡') {
      return result('シャルドネ、ピノ・ノワール', 0.82, 'regional-blend');
    }
    return result('シャルドネ', 0.96, 'region-type');
  }

  if (/ボルドー|サン・テミリオン|ポムロール|メドック|マルゴー|ポイヤック|グラーヴ|ペサック/.test(origin + name)) {
    if (wineType === '白' || wineType === '泡') {
      return result('ソーヴィニヨン・ブラン、セミヨン', 0.9, 'appellation');
    }
    if (/サン・テミリオン|ポムロール|フロンサック|カスティヨン|コート/.test(origin + name)) {
      return result('メルロ、カベルネ・フラン', 0.9, 'right-bank');
    }
    return result('カベルネ・ソーヴィニヨン、メルロ', 0.9, 'left-bank-or-bordeaux');
  }

  if (/シャンパーニュ/.test(origin)) {
    if (/ブラン[・･\s]?ド[・･\s]?ブラン/.test(name)) {
      return result('シャルドネ', 0.98, 'appellation');
    }
    if (/ブラン[・･\s]?ド[・･\s]?ノワール/.test(name)) {
      return result('ピノ・ノワール、ムニエ', 0.95, 'appellation');
    }
    return result('シャルドネ、ピノ・ノワール、ムニエ', 0.9, 'regional-blend');
  }

  if (/ロワール/.test(origin)) {
    if (/ミュスカデ/.test(name)) return result('ムロン・ド・ブルゴーニュ', 0.98, 'appellation');
    if (/プイィ・フュメ|サンセール/.test(name)) {
      return wineType === '赤' || wineType === 'ロゼ'
        ? result('ピノ・ノワール', 0.97, 'appellation')
        : result('ソーヴィニヨン・ブラン', 0.97, 'appellation');
    }
    if (wineType === '泡') return result('シュナン・ブラン、シャルドネ', 0.78, 'regional-blend');
    return wineType === '赤'
      ? result('カベルネ・フラン', 0.75, 'region-type')
      : result('シュナン・ブラン', 0.75, 'region-type');
  }

  if (/アルザス|ロレーヌ/.test(origin)) {
    if (wineType === '赤') return result('ピノ・ノワール', 0.9, 'region-type');
    if (wineType === '泡') return result('ピノ・ブラン、オーセロワ', 0.84, 'regional-blend');
    return result('リースリング', 0.72, 'region-type');
  }

  if (/シュッド・ウエスト/.test(origin)) {
    if (wineType === '白') return result('コロンバール、ソーヴィニヨン・ブラン', 0.76, 'regional-blend');
    if (wineType === 'ロゼ') return result('メルロ、カベルネ・フラン', 0.74, 'regional-blend');
    return result('マルベック、メルロ、タナ', 0.76, 'regional-blend');
  }

  if (/ローヌ/.test(origin)) {
    if (wineType === '白') {
      return result('グルナッシュ・ブラン、ルーサンヌ、クレレット', 0.84, 'regional-blend');
    }
    if (wineType === 'ロゼ') return result('グルナッシュ、サンソー', 0.82, 'regional-blend');
    return result('グルナッシュ、シラー、ムールヴェードル', 0.9, 'regional-blend');
  }

  if (/ラングドック|ルーション|プロヴァンス/.test(origin)) {
    if (wineType === '白' || wineType === '泡') {
      return result('グルナッシュ・ブラン、ヴェルメンティーノ', 0.76, 'regional-blend');
    }
    if (wineType === 'ロゼ') return result('グルナッシュ、サンソー', 0.86, 'regional-blend');
    return result('グルナッシュ、シラー、ムールヴェードル', 0.82, 'regional-blend');
  }

  if (/ジュラ|サヴォワ/.test(origin)) {
    return wineType === '赤'
      ? result('ピノ・ノワール', 0.86, 'region-type')
      : result('シャルドネ', 0.86, 'region-type');
  }

  if (/ピエモンテ/.test(origin)) {
    return wineType === '白'
      ? result('コルテーゼ', 0.66, 'region-type')
      : result('ネッビオーロ', 0.7, 'region-type');
  }

  if (/トスカーナ/.test(origin)) return result('サンジョヴェーゼ', 0.9, 'region');
  if (/アブルッツォ/.test(origin)) {
    return wineType === '赤' || wineType === 'ロゼ'
      ? result('モンテプルチアーノ', 0.92, 'region-type')
      : result('ペコリーノ', 0.72, 'region-type');
  }
  if (/ヴェネト/.test(origin)) {
    if (wineType === '泡') return result('グレーラ', 0.82, 'region-type');
    return wineType === '赤'
      ? result('コルヴィーナ、ロンディネッラ', 0.8, 'region-type')
      : result('ガルガネガ', 0.72, 'region-type');
  }
  if (/シチリア/.test(origin)) {
    return wineType === '赤'
      ? result('ネロ・ダヴォラ', 0.82, 'region-type')
      : result('グリッロ', 0.78, 'region-type');
  }
  if (/フリウリ/.test(origin)) {
    return wineType === '赤'
      ? result('レフォスコ', 0.65, 'region-type')
      : result('フリウラーノ', 0.74, 'region-type');
  }
  if (/バジリカータ/.test(origin)) return result('アリアニコ', 0.96, 'region');
  if (/プーリア/.test(origin)) return result('プリミティーヴォ', 0.9, 'region');
  if (/モリーゼ/.test(origin)) return result('モンテプルチアーノ、アリアニコ', 0.76, 'regional-blend');
  if (/マルケ/.test(origin)) return result('ラクリマ', 0.82, 'region');

  if (/リオハ/.test(origin)) {
    if (wineType === '白' || wineType === '泡') return result('ヴィウラ', 0.88, 'region-type');
    if (wineType === 'ロゼ') return result('テンプラニーリョ、グルナッシュ', 0.84, 'regional-blend');
    return result('テンプラニーリョ、グラシアーノ', 0.9, 'regional-blend');
  }
  if (/カヴァ|カタルーニャ/.test(origin) && wineType === '泡') {
    return result('マカベオ、チャレッロ、パレリャーダ', 0.94, 'appellation');
  }
  if (/カタルーニャ/.test(origin) && wineType === 'ロゼ') {
    return result('ガルナッチャ、トレパット', 0.82, 'regional-blend');
  }
  if (/カスティーリャ・イ・レオン/.test(origin)) {
    return wineType === '白'
      ? result('ヴェルデホ', 0.72, 'region-type')
      : result('テンプラニーリョ', 0.86, 'region-type');
  }
  if (/カスティーリャ・ラ・マンチャ/.test(origin)) {
    return wineType === '白'
      ? result('アイレン', 0.68, 'region-type')
      : result('テンプラニーリョ', 0.72, 'region-type');
  }
  if (/アラゴン|カリニェナ/.test(origin)) {
    return wineType === '白' || wineType === '泡'
      ? result('マカベオ', 0.7, 'region-type')
      : result('グルナッシュ、カリニャン', 0.82, 'regional-blend');
  }
  if (/ナバーラ/.test(origin)) return result('テンプラニーリョ、グルナッシュ', 0.8, 'regional-blend');

  if (/マールボロ/.test(origin)) {
    return wineType === '赤'
      ? result('ピノ・ノワール', 0.88, 'region-type')
      : result('ソーヴィニヨン・ブラン', 0.9, 'region-type');
  }
  if (/ファルツ|ドイツ/.test(origin)) {
    if (wineType === '赤' || wineType === 'ロゼ') return result('ピノ・ノワール', 0.82, 'region-type');
    if (wineType === '泡') return result('リースリング、ピノ・ブラン', 0.78, 'regional-blend');
    return result('リースリング', 0.76, 'region-type');
  }
  if (/スロヴェニア|ポドラウイエ/.test(origin)) {
    if (wineType === '泡') return result('シャルドネ、ピノ・ノワール', 0.78, 'regional-blend');
    if (wineType === 'ロゼ') return result('ピノ・ノワール', 0.72, 'region-type');
    return wineType === '赤'
      ? result('ブラウフレンキッシュ', 0.62, 'region-type')
      : result('リースリング', 0.62, 'region-type');
  }
  if (/オレゴン/.test(origin)) {
    return wineType === '赤'
      ? result('ピノ・ノワール', 0.84, 'region-type')
      : result('ピノ・グリ', 0.76, 'region-type');
  }
  if (/アルゼンチン|メンドーサ/.test(origin)) {
    return wineType === '赤'
      ? result('マルベック', 0.88, 'region-type')
      : result('シャルドネ', 0.65, 'region-type');
  }
  if (/南アフリカ/.test(origin)) {
    return wineType === '赤'
      ? result('ピノタージュ', 0.72, 'region-type')
      : result('シュナン・ブラン', 0.72, 'region-type');
  }
  if (/イギリス|ケント/.test(origin)) {
    if (wineType === '泡' || wineType === 'ロゼ') {
      return result('シャルドネ、ピノ・ノワール、ムニエ', 0.9, 'regional-blend');
    }
    return wineType === '赤'
      ? result('ピノ・ノワール', 0.8, 'region-type')
      : result('シャルドネ', 0.72, 'region-type');
  }
  if (/トカイ/.test(origin)) return result('フルミント', 0.95, 'region');
  if (/ミーニョ|ポルトガル/.test(origin)) return result('アルバリーニョ主体', 0.82, 'region');
  if (/中国/.test(origin)) {
    return wineType === '赤'
      ? result('カベルネ・ソーヴィニヨン、マルスラン', 0.62, 'regional-blend')
      : result('シャルドネ', 0.58, 'region-type');
  }

  const existing = normalizeText(currentGrape);
  if (isUsefulExistingGrape(existing, wineType, name)) {
    return result(existing, 0.7, 'existing-specific');
  }

  if (wineType === '泡') return result('シャルドネ、ピノ・ノワール', 0.55, 'type-fallback');
  if (wineType === 'ロゼ') return result('グルナッシュ主体', 0.5, 'type-fallback');
  if (wineType === 'オレンジ') return result('白ブドウ品種のブレンド', 0.45, 'type-fallback');
  if (wineType === '白') return result('シャルドネ', 0.45, 'type-fallback');
  return result('カベルネ・ソーヴィニヨン主体のブレンド', 0.4, 'type-fallback');
}

function inferTaste({ name, origin, wineType, grape }) {
  if (wineType === '泡') {
    return {
      body: /ミレジム|プレスティージュ|フュ・ド・シェーヌ/.test(name) ? 3 : 2,
      acidity: 5,
      tannin: 1,
      sweetness: inferSweetness(name, 2),
    };
  }
  if (wineType === 'ロゼ') {
    return { body: 2, acidity: 4, tannin: 1, sweetness: inferSweetness(name, 2) };
  }
  if (wineType === 'オレンジ') {
    return { body: 3, acidity: 4, tannin: 2, sweetness: inferSweetness(name, 2) };
  }

  let taste = wineType === '白'
    ? { body: 3, acidity: 4, tannin: 1, sweetness: 2 }
    : { body: 3, acidity: 3, tannin: 3, sweetness: 2 };

  const profiles = [
    [/ピノ・ノワール|ガメイ|ペラヴェルガ/, { body: 2, acidity: 4, tannin: 2, sweetness: 2 }],
    [/シャルドネ/, { body: 3, acidity: 4, tannin: 1, sweetness: 2 }],
    [/アリゴテ|ソーヴィニヨン・ブラン|ミュスカデ|ムロン/, { body: 2, acidity: 5, tannin: 1, sweetness: 2 }],
    [/リースリング|フルミント/, { body: 2, acidity: 5, tannin: 1, sweetness: 2 }],
    [/ゲヴュルツ|ミュスカ|ヴィオニエ/, { body: 3, acidity: 3, tannin: 1, sweetness: 3 }],
    [/ピノ・グリ|グレーラ|ヴィウラ|マカベオ|ガルガネガ|コルテーゼ|アルネイス/, { body: 2, acidity: 4, tannin: 1, sweetness: 2 }],
    [/シュナン|セミヨン|グルナッシュ・ブラン|ルーサンヌ|マルサンヌ|ペコリーノ/, { body: 3, acidity: 4, tannin: 1, sweetness: 2 }],
    [/カベルネ・ソーヴィニヨン|ボルドー|カベルネ・フラン/, { body: 4, acidity: 3, tannin: 4, sweetness: 2 }],
    [/メルロ/, { body: 3, acidity: 3, tannin: 3, sweetness: 2 }],
    [/シラー|プティ・シラー/, { body: 4, acidity: 3, tannin: 4, sweetness: 2 }],
    [/グルナッシュ|ムールヴェードル|カリニャン/, { body: 4, acidity: 3, tannin: 3, sweetness: 2 }],
    [/ネッビオーロ/, { body: 5, acidity: 5, tannin: 5, sweetness: 2 }],
    [/バルベーラ/, { body: 3, acidity: 5, tannin: 2, sweetness: 2 }],
    [/サンジョヴェーゼ|ラクリマ/, { body: 3, acidity: 4, tannin: 3, sweetness: 2 }],
    [/テンプラニーリョ|グラシアーノ/, { body: 4, acidity: 3, tannin: 3, sweetness: 2 }],
    [/マルベック|カルメネール|ピノタージュ|モンテプルチアーノ|プリミティーヴォ|ネロ・ダヴォラ/, { body: 4, acidity: 3, tannin: 4, sweetness: 2 }],
    [/アリアニコ/, { body: 5, acidity: 4, tannin: 5, sweetness: 2 }],
  ];

  for (const [pattern, profile] of profiles) {
    if (pattern.test(grape)) {
      taste = { ...profile };
      break;
    }
  }

  if (/シャブリ/.test(name)) taste = { body: 2, acidity: 5, tannin: 1, sweetness: 2 };
  if (/ジュヴレ|ポマール|モレ|シャンベルタン|クロ・ド・ヴージョ|ニュイ/.test(name) && /ピノ・ノワール/.test(grape)) {
    taste = { body: 3, acidity: 4, tannin: 3, sweetness: 2 };
  }
  if (/シャンボール|ヴォーヌ・ロマネ/.test(name) && /ピノ・ノワール/.test(grape)) {
    taste = { body: 3, acidity: 4, tannin: 2, sweetness: 2 };
  }
  if (/ムルソー|コルトン・シャルルマーニュ|モンラッシェ|プイィ・フュイッセ/.test(name)) {
    taste = { body: 4, acidity: 4, tannin: 1, sweetness: 2 };
  }
  if (/グラン[・\s]?クリュ|リゼルヴァ|レゼルバ|グラン[・\s]?レゼルヴ|ヴィエイユ[・\s]?ヴィーニュ|アマローネ/.test(name)) {
    taste.body = Math.min(5, taste.body + 1);
  }
  if (/アマローネ|アパッシメント|パッシート/.test(name)) {
    taste.sweetness = Math.max(3, taste.sweetness);
  } else {
    taste.sweetness = inferSweetness(name, taste.sweetness);
  }

  return clampTaste(taste);
}

function inferAromas({ name, origin, wineType, grape, seed }) {
  if (wineType === '泡') {
    return selectItems(['レモン', '青リンゴ', 'ナッツ', 'アカシアの花', 'グレープフルーツ'], seed, 4);
  }
  if (wineType === 'ロゼ') {
    return selectItems(['イチゴ', 'フランボワーズ', 'グレープフルーツ', 'ローズ', 'レッドカラント'], seed, 4);
  }
  if (wineType === 'オレンジ') {
    return selectItems(['オレンジの皮', 'ドライフルーツ', 'ナッツ', 'ハチミツ', 'アプリコット'], seed, 4);
  }

  const mappings = [
    [/ピノ・ノワール/, ['チェリー', 'フランボワーズ', 'スミレ', 'きのこ', 'ローズ', 'レッドカラント']],
    [/ガメイ/, ['イチゴ', 'フランボワーズ', 'スミレ', 'バナナ', 'チェリー']],
    [/シャルドネ/, ['青リンゴ', 'レモン', '洋ナシ', 'アカシアの花', 'ナッツ', 'バニラ']],
    [/アリゴテ/, ['レモン', '青リンゴ', 'グレープフルーツ', 'ミント']],
    [/ソーヴィニヨン・ブラン/, ['グレープフルーツ', 'ハーブ', 'ミント', 'レモン', '青リンゴ']],
    [/リースリング|フルミント/, ['レモン', '青リンゴ', 'アカシアの花', 'ハチミツ', '花梨']],
    [/ゲヴュルツ|ミュスカ/, ['ライチ', 'ローズ', 'ハチミツ', 'オレンジの皮', 'アプリコット']],
    [/ピノ・グリ|ヴィオニエ/, ['洋ナシ', '白桃', 'メロン', 'ハチミツ', 'アプリコット']],
    [/シュナン|セミヨン/, ['花梨', 'ハチミツ', 'アカシアの花', '洋ナシ', 'ナッツ']],
    [/カベルネ・ソーヴィニヨン/, ['カシス', 'ブラックチェリー', 'ピーマン', '樽', 'タバコ', 'チョコレート']],
    [/カベルネ・フラン/, ['フランボワーズ', 'ピーマン', 'スミレ', 'タバコ', 'カシス']],
    [/メルロ/, ['プラム', 'ブラックチェリー', 'チョコレート', 'バニラ', 'カシス']],
    [/シラー|プティ・シラー/, ['ブラックベリー', '胡椒', 'インク', 'スパイス', 'プラム']],
    [/グルナッシュ|ムールヴェードル|カリニャン/, ['チェリー', 'プラム', 'ドライフルーツ', 'スパイス', 'リコリス']],
    [/ネッビオーロ/, ['ローズ', 'チェリー', 'タール', 'トリュフ', 'ドライフルーツ']],
    [/バルベーラ/, ['チェリー', 'プラム', 'スミレ', 'スパイス', 'リコリス']],
    [/サンジョヴェーゼ/, ['チェリー', 'レッドカラント', 'スパイス', 'タバコ', 'スミレ']],
    [/テンプラニーリョ|グラシアーノ/, ['プラム', 'ドライフルーツ', 'バニラ', 'タバコ', 'チェリー']],
    [/マルベック/, ['ブラックベリー', 'プラム', 'スミレ', 'チョコレート', 'インク']],
    [/カルメネール/, ['カシス', 'ピーマン', 'プラム', 'スパイス', 'チョコレート']],
    [/モンテプルチアーノ|ネロ・ダヴォラ|プリミティーヴォ/, ['ブラックチェリー', 'プラム', 'リコリス', 'スパイス', 'ドライフルーツ']],
    [/アリアニコ/, ['ブラックチェリー', 'プラム', 'タバコ', 'タール', 'スパイス']],
    [/ピノタージュ/, ['ブラックベリー', 'プラム', 'モカ', 'スパイス', 'タバコ']],
  ];

  let pool = wineType === '白'
    ? ['青リンゴ', 'レモン', '洋ナシ', 'アカシアの花', 'グレープフルーツ']
    : ['カシス', 'ブラックチェリー', 'プラム', 'スパイス', '樽'];

  for (const [pattern, aromas] of mappings) {
    if (pattern.test(grape)) {
      pool = aromas;
      break;
    }
  }

  if (/シャブリ/.test(name)) pool = ['レモン', '青リンゴ', '貝殻（ミネラル）', 'グレープフルーツ', 'ミント'];
  if (/ムルソー|樽|バレル|オーク/.test(name)) pool = unique(['バニラ', 'ナッツ', 'ハチミツ', ...pool]);
  if (/海|島|沿岸|コースト/.test(name + origin) && wineType === '白') {
    pool = unique(['貝殻（ミネラル）', ...pool]);
  }

  return selectItems(pool, seed, 4).filter((aroma) => AROMA_REFERENCE.has(aroma));
}

function inferPairingFood({ name, origin, wineType, grape, seed }) {
  if (wineType === '泡') {
    return selectItems(['生牡蠣', '天ぷら', '生ハム', 'フライドチキン', '白身魚のカルパッチョ', '寿司'], seed, 4);
  }
  if (wineType === 'ロゼ') {
    return selectItems(['ニース風サラダ', 'ブイヤベース', '生ハム', '海老のグリル', 'ローストチキン', 'トマト料理'], seed, 4);
  }
  if (wineType === 'オレンジ') {
    return selectItems(['タンドリーチキン', 'スパイスカレー', '豚肉のロースト', '発酵食品', '中華料理', '焼き野菜'], seed, 4);
  }

  if (/シャブリ/.test(name)) {
    return selectItems(['生牡蠣', '帆立のカルパッチョ', '舌平目のムニエル', '山羊乳チーズ', '寿司', '白身魚の塩焼き'], seed, 4);
  }
  if (/ムルソー|モンラッシェ|コルトン・シャルルマーニュ/.test(name)) {
    return selectItems(['オマール海老のバター焼き', '鶏肉のクリーム煮', '帆立のソテー', '白身魚のグラタン', 'フォアグラ', '熟成コンテ'], seed, 4);
  }

  const mappings = [
    [/ピノ・ノワール/, ['鴨胸肉のロースト', '鶏肉の赤ワイン煮', 'きのこのリゾット', '鮪のたたき', 'すき焼き', '豚肉のロースト']],
    [/ガメイ/, ['シャルキュトリー', '焼き鳥（たれ）', 'パテ・ド・カンパーニュ', 'ローストチキン', '肉じゃが', 'ピザ']],
    [/シャルドネ/, ['白身魚のムニエル', '鶏肉のクリーム煮', '帆立のソテー', 'グラタン', 'ローストチキン', '天ぷら']],
    [/ソーヴィニヨン・ブラン/, ['山羊乳チーズ', '白身魚のセビーチェ', 'アスパラガスのグリル', 'ハーブを利かせた魚料理', '生牡蠣', '春野菜の天ぷら']],
    [/リースリング|フルミント/, ['シュークルート', '豚肉のロースト', 'スパイシーなアジア料理', 'スモークサーモン', '鴨の照り焼き', '鮎の塩焼き']],
    [/ゲヴュルツ|ミュスカ|ヴィオニエ/, ['フォアグラ', '海老のスパイス炒め', 'タイ料理', '鶏肉の香草焼き', 'ブルーチーズ', '酢豚']],
    [/ピノ・グリ/, ['サーモンのグリル', '豚肉のソテー', 'クリームパスタ', '海老の天ぷら', 'ローストチキン', '温野菜']],
    [/カベルネ・ソーヴィニヨン/, ['牛ステーキ', '仔羊のロースト', '牛肉の赤ワイン煮', '熟成ハードチーズ', 'ローストビーフ', 'うなぎの蒲焼']],
    [/メルロ/, ['ハンバーグ', '鴨のコンフィ', 'すき焼き', 'きのこソースの肉料理', 'ミートローフ', '豚の角煮']],
    [/シラー|プティ・シラー/, ['ラムチョップ', '胡椒を利かせたステーキ', 'ジビエのロースト', 'バーベキュー', 'スペアリブ', '麻婆豆腐']],
    [/グルナッシュ|ムールヴェードル|カリニャン/, ['カスレ', '仔羊の香草焼き', 'ラタトゥイユ', 'シャルキュトリー', '鴨のコンフィ', '牛すじ煮込み']],
    [/ネッビオーロ/, ['牛頬肉の煮込み', 'ポルチーニのリゾット', 'トリュフのパスタ', '熟成チーズ', '仔牛のロースト', 'すき焼き']],
    [/バルベーラ/, ['ミートソースパスタ', 'サルシッチャ', 'トマト煮込み', 'ピザ', '豚肉のグリル', 'ラザニア']],
    [/サンジョヴェーゼ/, ['ビステッカ', 'トマトソースのパスタ', 'マルゲリータ', 'サラミ', '仔羊のロースト', '牛肉のラグー']],
    [/テンプラニーリョ|グラシアーノ/, ['仔羊のロースト', '生ハム', 'きのこのタパス', '肉のパエリア', 'チョリソー', '牛肉の炭火焼き']],
    [/マルベック/, ['牛肉の炭火焼き', 'エンパナーダ', 'ラムチョップ', 'チョリソー', 'ハンバーグ', '熟成チーズ']],
    [/モンテプルチアーノ|ネロ・ダヴォラ|プリミティーヴォ/, ['牛肉のラグー', 'サルシッチャ', 'ピザ', '仔羊のロースト', 'トマト煮込み', 'スペアリブ']],
    [/アリアニコ/, ['牛すね肉の煮込み', '仔羊のロースト', 'ジビエ', '熟成チーズ', '牛ステーキ', '豚肉の炭火焼き']],
    [/ピノタージュ/, ['バーベキュー', 'スペアリブ', '燻製肉', 'ラムチョップ', 'ハンバーグ', 'カレー風味の肉料理']],
  ];

  for (const [pattern, pairings] of mappings) {
    if (pattern.test(grape)) return selectItems(pairings, seed, 4);
  }

  return wineType === '白'
    ? selectItems(['白身魚のグリル', '魚介のパスタ', 'ローストチキン', '天ぷら', 'フレッシュチーズ', '温野菜'], seed, 4)
    : selectItems(['牛肉のロースト', '豚肉のグリル', '煮込み料理', '熟成チーズ', '焼き鳥', 'きのこ料理'], seed, 4);
}

function buildComment({ name, origin, wineType, grape, aromas, taste, pairings, seed }) {
  const aromaText = aromas.slice(0, 3).join('、');
  const tasteText = describeTaste(taste, wineType);
  const pairText = pairings.slice(0, 2).join('や');
  const typeLabel = wineType === '泡' ? 'スパークリングワイン' : `${wineType}ワイン`;
  const templates = [
    `${name}は、${origin}の個性を映す${grape}主体の${typeLabel}。${aromaText}の香りが重なり、${tasteText}。${pairText}と合わせれば、余韻の美しさがいっそう際立ちます。`,
    `${origin}らしい魅力を備えた${name}。${grape}由来の${aromaText}が立体的に広がり、口中では${tasteText}。${pairText}に寄り添い、食卓を上質に仕上げる一本です。`,
    `${name}のグラスから立ち上がるのは、${aromaText}の洗練された香り。${grape}の持ち味と${origin}の風土が溶け合い、${tasteText}。${pairText}との組み合わせをぜひお楽しみください。`,
    `${grape}の表情を丁寧に引き出した${name}。${aromaText}が華やかに香り、${tasteText}。${origin}らしい余韻は${pairText}と好相性で、特別な一皿をさらに引き立てます。`,
    `${name}は${origin}の風土を感じる本格派。${aromaText}のニュアンスに、${grape}らしい奥行きが続き、${tasteText}。${pairText}と合わせたい、完成度の高い一本です。`,
    `${origin}から届いた${name}は、${aromaText}を思わせる香りが印象的。${grape}の個性を軸に、${tasteText}。${pairText}とともに味わえば、心地よい余韻までゆっくり楽しめます。`,
  ];

  let comment = templates[hashString(seed) % templates.length];
  const closers = [
    '温度の変化とともに香りがほどけ、二杯目を誘います。',
    'ゆっくりグラスを回すほど、複雑な香りと奥行きが現れます。',
    '親しみやすさと品格を兼ね備え、幅広い食卓で活躍します。',
  ];

  if (comment.length < 100) {
    comment += closers[hashString(`${seed}-closer`) % closers.length];
  }

  if (comment.length > 150) {
    comment = `${name}は${origin}の${grape}主体の${typeLabel}。${aromaText}が香り、${tasteText}。${pairText}と好相性で、料理とともに余韻まで楽しめる一本です。`;
  }

  if (comment.length > 150) {
    comment = `${origin}の${grape}主体の${typeLabel}。${aromaText}が香り、${tasteText}。${pairText}と好相性で、食事とともに長い余韻まで楽しめます。`;
  }

  if (comment.length < 100) {
    comment += '香りと味わいの調和が美しく、食事とともにゆっくり楽しみたい一本です。';
  }

  return comment;
}

function makeGeneratedCommentsUnique(rebuiltRows) {
  const groups = new Map();
  for (const item of rebuiltRows) {
    if (item.meta.skipped) continue;
    const comment = item.update.comment;
    if (!groups.has(comment)) groups.set(comment, []);
    groups.get(comment).push(item);
  }

  const endings = [
    '香りの変化を追いながら、ゆっくり味わいたい一本です',
    '温度が上がるにつれ、奥行きのある表情が現れます',
    '料理との一体感が心地よく、杯を重ねたくなります',
    '余韻に品格があり、特別な食卓にもよく映えます',
    '果実味と酸の調和が美しく、飲み進めるほど魅力が増します',
    'グラスの中で香りがほどけ、長い余韻へつながります',
    '繊細さと力強さを併せ持ち、食事を格上げします',
    '口中でゆっくり開き、最後まで上品な印象を残します',
    '味わいの輪郭が明瞭で、料理の旨味を引き出します',
    '落ち着いた余韻が続き、会話の時間を豊かにします',
    '香りに複雑さがあり、ひと口ごとに新しい表情を見せます',
    '果実の純度が高く、食後まで心地よい余韻が続きます',
    '酸とコクの均衡がよく、洗練された飲み心地です',
    '滑らかな質感と香りの広がりが、印象深い余韻を生みます',
    '端正な仕上がりで、記憶に残るペアリングを楽しめます',
    '落ち着きのある風味が、素材の持ち味を丁寧に引き立てます',
  ];

  for (const items of groups.values()) {
    if (items.length <= 1) continue;
    items.forEach((item, index) => {
      item.update.comment = buildUniqueComment(item, endings[index % endings.length]);
    });
  }
}

function buildUniqueComment(item, ending) {
  const wine = item.meta.original;
  const name = normalizeText(wine.name) || 'このワイン';
  const origin = normalizeText(wine.origin) || '産地';
  const grape = item.update.grape;
  const aromas = item.update.aromas.slice(0, 3).join('、');
  const tasteText = describeTaste(item.update.taste, normalizeWineType(wine.wine_type, name, origin));
  const pairings = String(item.update.pairing_food).split('、').slice(0, 2).join('や');

  let comment = `${name}は${origin}の${grape}主体。${aromas}が香り、${tasteText}。${pairings}と好相性で、${ending}。`;
  if (comment.length > 150) {
    comment = `${origin}の${grape}主体。${aromas}が香り、${tasteText}。${pairings}と好相性で、${ending}。`;
  }
  if (comment.length < 100) {
    comment += '香りと味わいの調和を、食事とともにじっくり楽しめます。';
  }
  return comment;
}

function ensureGlobalCommentUniqueness(rebuiltRows) {
  const seen = new Set();
  const adverbs = [
    'とりわけ', 'ゆっくり', '時間をかけて', '食卓で', 'グラスの中で',
    '余韻まで', '温度を変えながら', '一皿とともに',
  ];
  const endings = [
    '香りの変化を追いながら味わいたい一本です',
    '奥行きのある表情をじっくり楽しめます',
    '料理との一体感が心地よく杯を重ねたくなります',
    '品格ある余韻が特別な食卓によく映えます',
    '果実味と酸の調和が飲み進めるほど深まります',
    '複雑な香りがほどけ長い余韻へつながります',
    '繊細さと力強さが料理を上品に引き立てます',
    '滑らかな質感が最後まで美しい印象を残します',
  ];

  for (const item of rebuiltRows) {
    if (item.meta.skipped) continue;
    let comment = item.update.comment;
    let variant = 0;

    while (seen.has(comment) && variant < adverbs.length * endings.length) {
      const adverb = adverbs[variant % adverbs.length];
      const ending = endings[Math.floor(variant / adverbs.length) % endings.length];
      comment = buildUniqueComment(item, `${adverb}${ending}`);
      variant += 1;
    }

    item.update.comment = comment;
    seen.add(comment);
  }
}

function describeTaste(taste, wineType) {
  const body = ['繊細な', '軽快な', '程よい厚みの', '豊かなコクの', '重厚な'][taste.body - 1];
  const acidity = taste.acidity >= 4 ? '伸びやかな酸' : taste.acidity <= 2 ? '穏やかな酸' : 'バランスのよい酸';
  const tannin = taste.tannin >= 4 ? '力強いタンニン' : taste.tannin === 3 ? 'きめ細かなタンニン' : '滑らかな口当たり';
  const sweetness = taste.sweetness >= 4 ? '豊かな甘み' : taste.sweetness === 3 ? 'ほのかな甘み' : '端正な辛口';

  if (wineType === '赤') return `${body}ボディに${acidity}と${tannin}が調和します`;
  if (wineType === '泡') return `${sweetness}の味わいに${acidity}ときめ細かな泡が続きます`;
  return `${body}質感に${acidity}と${sweetness}の果実味が調和します`;
}

function inferColorValue(wineType, taste) {
  if (wineType === '赤') return clamp(30 - ((taste.body - 1) * 6), 0, 30);
  if (wineType === '白') return clamp(100 - ((taste.body - 1) * 7), 70, 100);
  if (wineType === '泡') return clamp(98 - ((taste.body - 1) * 5), 80, 100);
  if (wineType === 'ロゼ') return 52;
  if (wineType === 'オレンジ') return 62;
  return 50;
}

function inferScenes(wine) {
  const price = Number(wine.bottle_price);
  if (Number.isFinite(price) && price > 0) {
    if (price <= 3000) return { sceneRetail: '家飲み', sceneRestaurant: '軽く一杯', source: 'bottle_price' };
    if (price <= 6000) return { sceneRetail: '自分へのご褒美', sceneRestaurant: 'しっかり食事', source: 'bottle_price' };
    if (price <= 10000) return { sceneRetail: 'ギフト', sceneRestaurant: '接待・ビジネス', source: 'bottle_price' };
    return { sceneRetail: '記念日', sceneRestaurant: 'デート・記念日', source: 'bottle_price' };
  }

  const sceneRetail = VALID_RETAIL_SCENES.has(wine.scene_retail)
    ? wine.scene_retail
    : '自分へのご褒美';
  const sceneRestaurant = VALID_RESTAURANT_SCENES.has(wine.scene_restaurant)
    ? wine.scene_restaurant
    : 'しっかり食事';
  return { sceneRetail, sceneRestaurant, source: 'existing-or-fallback' };
}

function buildTags(taste) {
  const tags = [];
  if (taste.tannin <= 2) tags.push('ワイン初心者');
  if (taste.tannin >= 3) tags.push('中級～上級者');
  if (taste.body >= 3) tags.push('じっくり味わう');
  if (taste.body <= 2) tags.push('軽やかに飲む');
  if (taste.sweetness >= 3) tags.push('リラックス');
  if (taste.sweetness <= 2) tags.push('食事を引き立てたい');
  if (taste.acidity >= 3) tags.push('気分を上げたい');
  if (taste.acidity <= 2) tags.push('会話を楽しみたい');
  return tags;
}

async function updateAllWines(updates) {
  let completed = 0;
  await mapLimit(updates, 10, async (update) => {
    const { id, jan_code: _, ...fields } = update;
    const { error } = await supabase
      .from('wines')
      .update(fields)
      .eq('id', id);
    if (error) throw error;
    completed += 1;
    if (completed % UPDATE_CHUNK_SIZE === 0 || completed === updates.length) {
      console.log(`DB更新進捗: ${completed}/${updates.length}`);
    }
  });
}

async function verifyUpdates(rebuiltRows) {
  const expected = new Map(rebuiltRows.map((item) => [item.update.jan_code, item.update]));
  const actualRows = await fetchAllWines();
  const mismatches = [];
  let matched = 0;

  for (const actual of actualRows) {
    const expectedRow = expected.get(String(actual.jan_code));
    if (!expectedRow) continue;
    const fields = [];
    for (const [field, value] of Object.entries(expectedRow)) {
      if (!sameValue(value, actual[field])) fields.push(field);
    }
    if (fields.length === 0) matched += 1;
    else mismatches.push({ jan_code: actual.jan_code, name: actual.name, fields });
  }

  return { expected: expected.size, matched, mismatches };
}

async function checkAllImages(wines) {
  const targets = wines.filter((wine) => String(wine.image_url ?? '').trim());
  let completed = 0;
  const results = await mapLimit(targets, IMAGE_CONCURRENCY, async (wine) => {
    const result = await checkImage(wine.image_url);
    completed += 1;
    if (completed % 100 === 0 || completed === targets.length) {
      console.log(`画像確認進捗: ${completed}/${targets.length}`);
    }
    return { wine, result };
  });

  return results
    .filter(({ result }) => !result.ok)
    .map(({ wine, result }) => ({
      jan_code: String(wine.jan_code),
      name: wine.name,
      image_url: wine.image_url,
      status: result.status,
      message: result.message,
    }));
}

async function checkImage(url) {
  let response = await requestImage(url, 'HEAD');
  if ([403, 405, 501].includes(response.status)) {
    response = await requestImage(url, 'GET');
  }
  return response;
}

async function requestImage(url, method) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'ai-sommelier-image-check/1.0' },
    });
    if (response.body) await response.body.cancel();
    return {
      ok: response.ok,
      status: response.status,
      message: response.statusText,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildSummary(originalRows, rebuiltRows) {
  const grapeCounts = countValues(rebuiltRows.map((item) => item.update.grape));
  const confidenceCounts = {
    high: rebuiltRows.filter((item) => item.meta.confidence >= 0.9).length,
    medium: rebuiltRows.filter((item) => item.meta.confidence >= 0.75 && item.meta.confidence < 0.9).length,
    low: rebuiltRows.filter((item) => item.meta.confidence < 0.75).length,
  };
  const commentLengths = rebuiltRows.map((item) => item.update.comment.length);
  const invalidAromas = rebuiltRows.flatMap((item) =>
    item.update.aromas
      .filter((aroma) => !AROMA_REFERENCE.has(aroma))
      .map((aroma) => ({ jan_code: item.update.jan_code, aroma }))
  );

  return {
    consoleSummary: {
      rows: rebuiltRows.length,
      grapeVarieties: grapeCounts.length,
      topGrapes: grapeCounts.slice(0, 20),
      confidence: confidenceCounts,
      bottlePricePopulated: originalRows.filter((row) => Number(row.bottle_price) > 0).length,
      scenesPreservedForMissingPrice: rebuiltRows.filter((item) => item.meta.sceneSource !== 'bottle_price').length,
      commentLength: {
        min: Math.min(...commentLengths),
        max: Math.max(...commentLengths),
        below100: commentLengths.filter((length) => length < 100).length,
        above150: commentLengths.filter((length) => length > 150).length,
      },
      invalidAromas: invalidAromas.length,
      duplicateComments: countDuplicateGeneratedComments(rebuiltRows),
      nonWineProductsPreserved: rebuiltRows.filter((item) => item.meta.skipped).length,
    },
    grapeCounts,
    confidenceCounts,
    invalidAromas,
  };
}

function countValues(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'ja'));
}

function countDuplicateGeneratedComments(rebuiltRows) {
  const comments = rebuiltRows
    .filter((item) => !item.meta.skipped)
    .map((item) => item.update.comment);
  return comments.length - new Set(comments).size;
}

function inferSweetness(name, fallback) {
  if (/極甘口|ドゥー|ドルチェ|パッシート/.test(name)) return 5;
  if (/甘口|アマービレ/.test(name)) return 4;
  if (/中甘口|半甘口|セミセコ|ドゥミ[・\s]?セック|カビネット/.test(name)) return 3;
  if (/エクストラ[・\s]?ブリュット|ブリュット[・\s]?ナチュール|ナチュレ/.test(name)) return 1;
  return fallback;
}

function normalizeWineType(value, name, origin) {
  const text = normalizeText(value);
  if (/シャンパーニュ/.test(origin)) return /ロゼ/.test(name) ? 'ロゼ' : '泡';
  if (/ブリュット|クレマン|カヴァ|スパークリング|スプマンテ|[ぺペ]ニーナ/.test(name)) {
    return /ロゼ|ロサード/.test(name) ? 'ロゼ' : '泡';
  }
  if (/白ワイン/.test(text)) return '白';
  if (['赤', '白', '泡', 'ロゼ', 'オレンジ'].includes(text)) return text;
  if (/ロゼ/.test(name)) return 'ロゼ';
  if (/スパーク|ブリュット|クレマン|カヴァ|シャンパーニュ/.test(name)) return '泡';
  return text || '赤';
}

function isUsefulExistingGrape(grape, wineType, name) {
  if (!grape) return false;
  if (grape === 'カベルネ・ソーヴィニヨン' && !/カベルネ/.test(name)) return false;
  if (grape === 'シャルドネ' && !/シャルドネ/.test(name)) return false;
  return /、|%|％|主体|100|ピノ|メルロ|マルベック|サンジョ|モンテ|ソーヴィニヨン|シラー|ネッビオーロ/.test(grape);
}

function isNonWineProduct(name) {
  return /ワインオープナー|ローラーバッグ|マスク$/.test(name);
}

function result(grape, confidence, source) {
  return { grape, confidence, source };
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .replace(/･/g, '・')
    .replace(/\s+/g, ' ');
}

function clampTaste(taste) {
  return {
    body: clamp(Math.round(taste.body), 1, 5),
    acidity: clamp(Math.round(taste.acidity), 1, 5),
    tannin: clamp(Math.round(taste.tannin), 1, 5),
    sweetness: clamp(Math.round(taste.sweetness), 1, 5),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function unique(values) {
  return [...new Set(values)];
}

function selectItems(items, seed, count) {
  const values = unique(items);
  if (values.length <= count) return values;
  const start = hashString(seed) % values.length;
  const selected = [];
  for (let index = 0; selected.length < count; index += 1) {
    selected.push(values[(start + index) % values.length]);
  }
  return selected;
}

function hashString(value) {
  let hash = 2166136261;
  for (const char of String(value ?? '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sameValue(expected, actual) {
  if (Array.isArray(expected)) return JSON.stringify(expected) === JSON.stringify(actual || []);
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

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(Math.max(limit, 1), items.length) }, worker)
  );
  return results;
}

async function loadEnvFile(filePath) {
  const raw = await fs.readFile(path.resolve(filePath), 'utf8');
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
