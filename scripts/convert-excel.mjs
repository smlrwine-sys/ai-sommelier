import fs from 'fs';
import xlsx from 'xlsx'; // ※CODEXの修正に合わせて変更しています

// ★修正：新しいエクセルファイル名に変更しました
const EXCEL_FILE = './商品マスタ260618_ワインのみくくり分.xlsx';
const OUTPUT_FILE = './wines_master.json';

const workbook = xlsx.readFile(EXCEL_FILE);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

const FRUITY_AROMAS = ['インク', 'ブラックチェリー', 'ブラックベリー', 'フランボワーズ', 'バナナ', 'パイナップル', '洋ナシ', 'アプリコット', '花梨', 'ライチ', 'メロン', 'マンゴー'];
const SPICY_AROMAS = ['胡椒', 'ピーマン', 'タール', 'ハーブ', '革', '樽', 'タバコ', 'ミント', 'オレンジの皮'];

const resultWines = [];

data.forEach((row) => {
  if (!row['タイプ名']) return;

  const typeName = row['タイプ名'] || '';
  let wineType = '赤';
  if (typeName.includes('白')) wineType = '白';
  if (typeName.includes('スパーク')) wineType = '泡';
  if (typeName.includes('ロゼ')) wineType = 'ロゼ';
  if (typeName.includes('オレンジ')) wineType = 'オレンジ';

  let body = parseInt(row['ボディ（コク）']) || 3;
  let acidity = parseInt(row['酸味']) || 3;
  let tannin = parseInt(row['渋み']) || (wineType === '赤' ? 3 : 1);
  let sweetness = 2;
  const tasteText = row['味わい１'] || '';
  if (tasteText.includes('極辛口')) sweetness = 1;
  else if (tasteText.includes('辛口')) sweetness = 2;
  else if (tasteText.includes('中甘口') || tasteText.includes('半甘口')) sweetness = 3;
  else if (tasteText.includes('薄甘口') || tasteText.includes('甘口')) sweetness = 4;
  else if (tasteText.includes('極甘口')) sweetness = 5;

  let colorVal = 50;
  if (wineType === '赤') colorVal = Math.max(0, 30 - ((body - 3) * 10));
  else if (wineType === '白' || wineType === '泡') colorVal = Math.min(100, 70 + ((4 - body) * 10));
  else colorVal = 50;

  const aromas = [];
  ['アロマ１', 'アロマ2', 'アロマ3'].forEach(key => {
    if (row[key] && typeof row[key] === 'string' && row[key] !== '-') aromas.push(row[key].trim());
  });

  const origin = `${row['原産国名'] || ''} ${row['地方名'] || ''}`.trim();
  const grape = row['ブドウ品種'] || (wineType === '白' ? 'シャルドネ' : 'カベルネ・ソーヴィニヨン');

  let comment = '';
  if (row['テイスティングコメント'] && row['テイスティングコメント'] !== '-') {
    comment = row['テイスティングコメント'];
  } else {
    const aromaText = aromas.length > 0 ? `グラスに注ぐと${aromas.join('や')}のアロマがふわりと広がります。` : 'グラスに注ぐと豊かな香りがふわりと広がります。';
    const tasteDetails = wineType === '赤'
      ? `程よい酸味と${tannin >= 3 ? 'しっかりとした' : '滑らかな'}渋みが調和した${body >= 4 ? '重厚な' : '親しみやすい'}ボディ。`
      : `爽やかな酸味と果実味が美しく調和した、${body >= 3 ? 'コクのある' : 'すっきりとした'}飲み口。`;
    comment = `「${origin}」のテロワールを表現した上質な${grape}の${wineType}ワイン。${aromaText}${tasteDetails}お食事に寄り添い、特別な時間を彩る至福の1本です。`;
  }

  // ★新規追加：超本格マリアージュ辞典（品種×産地×味わい）
  let pairings = new Set();
  const originText = origin || '';
  const grapeText = grape || '';

  // --- 1. 品種別（Grape）の王道マリアージュ ---
  if (grapeText.includes('ピノ・ノワール')) pairings.add('鴨のロースト').add('きのこのソテー').add('マグロの赤身');
  else if (grapeText.includes('カベルネ・ソーヴィニヨン')) pairings.add('牛ステーキ').add('炭火焼きの肉料理');
  else if (grapeText.includes('メルロー')) pairings.add('ハンバーグ').add('すき焼き');
  else if (grapeText.includes('シラー')) pairings.add('黒胡椒を効かせた肉料理').add('ジンギスカン');
  else if (grapeText.includes('サンジョヴェーゼ')) pairings.add('トマトソースのパスタ').add('マルゲリータ');
  else if (grapeText.includes('ネッビオーロ')) pairings.add('Tボーンステーキ').add('ラグーソースのパスタ');
  else if (grapeText.includes('シャルドネ')) {
      if (body >= 3) pairings.add('帆立のバター焼き').add('鶏肉のクリーム煮');
      else pairings.add('白身魚のムニエル').add('フレッシュチーズ');
  }
  else if (grapeText.includes('ソーヴィニヨン・ブラン')) pairings.add('ハーブサラダ').add('シェーブルチーズ');
  else if (grapeText.includes('リースリング')) pairings.add('豚肉の冷しゃぶ').add('エスニック料理');
  else if (grapeText.includes('ゲヴュルツトラミネール') || grapeText.includes('ヴィオニエ')) pairings.add('タイ料理').add('スパイシーカレー');

  // --- 2. 国・地域別（Origin）の郷土料理マリアージュ ---
  if (originText.includes('フランス') && originText.includes('ブルゴーニュ')) {
      if (wineType === '赤') pairings.add('牛肉の赤ワイン煮込み');
      else if (wineType === '白') pairings.add('エスカルゴの香草バター');
  }
  else if (originText.includes('イタリア')) pairings.add('生ハムとモッツァレラ').add('カプレーゼ');
  else if (originText.includes('スペイン')) pairings.add('アヒージョ').add('パエリア');
  else if (originText.includes('日本')) pairings.add('お寿司').add('出汁を効かせた和食');
  else if (originText.includes('アメリカ') || originText.includes('カリフォルニア')) pairings.add('BBQグリル').add('熟成ステーキ');
  else if (originText.includes('チリ') || originText.includes('アルゼンチン')) pairings.add('スパイシーな肉料理');

  // --- 3. タイプと味わい（Base）の補完マリアージュ ---
  if (wineType === '赤') {
      if (body >= 4 || tannin >= 4) pairings.add('熟成チーズ').add('ジビエ料理');
      else if (body <= 2) pairings.add('筑前煮').add('鶏の照り焼き');
  } else if (wineType === '白') {
      if (sweetness >= 4) pairings.add('ブルーチーズ').add('フルーツタルト');
      else if (acidity >= 4) pairings.add('生牡蠣').add('カルパッチョ');
  } else if (wineType === '泡') {
      if (sweetness >= 4) pairings.add('マカロン').add('フルーツの盛り合わせ');
      else pairings.add('フライドポテト').add('キャビア').add('天ぷら');
  } else if (wineType === 'ロゼ') {
      pairings.add('エビのチリソース').add('生春巻き').add('サーモンマリネ');
  } else if (wineType === 'オレンジ') {
      pairings.add('豚肉のスパイス焼き').add('酢豚').add('ウォッシュチーズ');
  }

  // 重複を弾いた上で、見栄えを考慮して先頭から最大4つに絞る
  let pairingArray = Array.from(pairings);
  if (pairingArray.length === 0) {
      pairingArray = ['チーズの盛り合わせ', 'ミックスナッツ', 'オリーブ'];
  }
  let pairingFood = pairingArray.slice(0, 4).join('、');

  const price = parseInt(row['通常販売価格(税抜）']) || 0;
  let sceneRetail = '';
  let sceneRestaurant = '';
  if (price <= 3000) {
      sceneRetail = '家飲み';
      sceneRestaurant = '軽く一杯';
  } else if (price <= 6000) {
      sceneRetail = '自分へのご褒美';
      sceneRestaurant = 'しっかり食事';
  } else if (price <= 10000) {
      sceneRetail = 'ギフト';
      sceneRestaurant = '接待・ビジネス';
  } else {
      sceneRetail = '記念日';
      sceneRestaurant = 'デート・記念日';
  }

  const tags = [];
  if (tannin <= 2) tags.push('ワイン初心者');
  if (tannin >= 3) tags.push('中級～上級者');
  if (body >= 3) tags.push('じっくり味わう');
  if (body <= 2) tags.push('軽やかに飲む');
  if (sweetness >= 3) tags.push('リラックス');
  if (sweetness <= 2) tags.push('食事を引き立てたい');
  if (acidity >= 3) tags.push('気分を上げたい');
  if (acidity <= 2) tags.push('会話を楽しみたい');

  const wineData = {
    jan_code: String(row['商品コード']).trim(),
    name: row['商品名1'],
    producer: (row['生産者説明情報'] || '').split('【仕入先】')[0].replace('【生産者名】', '').trim(),
    wine_type: wineType,
    origin: origin,
    grape: grape,
    alcohol: String(row['アルコール度数'] || '13') + '%',
    body: body,
    acidity: acidity,
    tannin: tannin,
    sweetness: sweetness,
    color_value: colorVal,
    aromas: aromas,
    image_url: `https://www.shiire-wine.com/uploads/products/${String(row['商品コード']).trim()}.jpg`,
    comment: comment,
    taste: { body: body, acidity: acidity, tannin: tannin, sweetness: sweetness },
    tags: tags,
    scene_retail: sceneRetail,
    scene_restaurant: sceneRestaurant,
    pairing_food: pairingFood // ★追加：マリアージュデータ
  };

  resultWines.push(wineData);
});

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resultWines, null, 2), 'utf-8');
console.log(`✅ 変換完了！ ${resultWines.length}件のワインデータを ${OUTPUT_FILE} に書き出しました。`);
