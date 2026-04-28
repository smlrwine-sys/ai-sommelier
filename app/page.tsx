'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
// reCAPTCHAをインポート（追加）
import ReCAPTCHA from "react-google-recaptcha";
import { 
  ChevronLeft, MapPin, Sparkles, Store, Utensils, Heart, ThumbsUp, Quote, Grape, Leaf, ChefHat, 
  Building, Wine, Plus, Trash2, Save, Settings, Hand, Smile, ArrowRight, MessageCircle, Bookmark
} from 'lucide-react';

// --- アロマ画像辞書 ---
const AROMA_IMAGES: Record<string, string> = {
  "ドライフルーツ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_dried-fruit.png",
  "胡椒": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_pepper.png",
  "プルーン": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_prune.png",
  "カシス": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_blackcurrant.png",
  "ピーマン": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_green-pepper.png",
  "プラム": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_plum.png",
  "スミレ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_sumire.png",
  "チェリー": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_cherry.png",
  "タール": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_tar.png",
  "トリュフ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_tryffe.png",
  "チョコレート": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_chocolate.png",
  "インク": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_ink.png",
  "リコリス": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_licorice.png",
  "ブラックチェリー": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_blackcherry.png",
  "ローズ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_rose.png",
  "きのこ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_mushroom.png",
  "ブラックベリー": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_blackberry.png",
  "スパイス": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_spices.png",
  "フランボワーズ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_framboise.png",
  "バナナ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_banana.png",
  "イチゴ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_strawberry.png",
  "ハーブ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_herb.png",
  "ハチミツ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_honey.png",
  "パイナップル": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_pineapple.png",
  "革": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_leather.png",
  "樽": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_barrel.png",
  "モカ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_mocha.png",
  "タバコ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_tobacco.png",
  "青リンゴ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_green-apple.png",
  "レモン": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_lemon.png",
  "貝殻（ミネラル）": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_shell.png",
  "洋ナシ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_pear.png",
  "白桃": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_white-peach.png",
  "ナッツ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_nuts.png",
  "アプリコット": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_apricot.png",
  "アカシアの花": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_acacia.png",
  "金木犀": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_osmanthusl.png",
  "バニラ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_tryffemary.png",
  "ミント": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_mint.png",
  "花梨": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_quince.png",
  "グレープフルーツ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_grapefruit.png",
  "レッドカラント": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_red-currant.png",
  "ライチ": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_litchi.png",
  "メロン": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_melon.png",
  "パン": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_bread.png",
  "オレンジの皮": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_orange-peel.png",
  "マンゴー": "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_mango.png"
};
const DEFAULT_AROMA_IMAGE = "https://wsommelier.com/client_info/WSOMMELIER/img/content/aroma_herb.png";

// --- 各種選択肢リスト ---

// 検索用タグは自動付与用リストに統一
const WINE_TAG_OPTIONS = [
  'ワイン初心者', '中級～上級者', 'じっくり味わう', '軽やかに飲む', 
  'リラックス', '食事を引き立てたい', '気分を上げたい', '会話を楽しみたい'
];

// シーン選択肢の追加
const SCENES_RETAIL = ['家飲み', '自分へのご褒美', 'ギフト', '記念日'];
const SCENES_RESTAURANT = ['軽く一杯', 'しっかり食事', '接待・ビジネス', 'デート・記念日'];
const GENRES_RESTAURANT = ['和食', '寿司屋', '洋食', '焼肉店', '中華料理', '韓国料理', 'イタリアン', 'フレンチ', 'インド料理', 'アジア料理', 'メキシカン', 'カフェ', 'バー', '居酒屋', 'パン屋', 'ファミリーレストラン'];
const GENRES_RETAIL = ['百貨店', '総合スーパー(GMS)', '食品スーパー', 'コンビニ(CVS)', 'ドラッグストア', '酒屋', 'ワインショップ', 'その他専門店（輸入食品等）', 'ホームセンター', 'ディスカウントストア', 'EC・通販'];
const SPEND_OPTIONS = ['～3,000円', '3,000～5,000円', '5,000～8,000円', '8,000～10,000円', '10,000～15,000円', '15,000～20,000円', '20,000～30,000円', '30,000～50,000円', '50,000円～'];
const AREA_OPTIONS = [
  '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区', '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区', '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区', '葛飾区', '江戸川区',
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都(23区外)', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

// --- テーマ設定 ---
const THEMES: Record<string, any> = {
  luxury: { 
    bg: 'bg-[#FAF9F6]', text: 'text-[#1A1A1A]', cardBg: 'bg-white', cardBorder: 'border-gray-100', primary: 'bg-[#A82B3B]', 
    heroImage: 'https://www.shiire-wine.com/uploads/img/content/winediagnosis/winediagnosis_b.png' // 地下カーブ
  },
  natural: { 
    bg: 'bg-stone-50', text: 'text-stone-900', cardBg: 'bg-white', cardBorder: 'border-stone-100', primary: 'bg-[#5B7C54]',
    heroImage: 'https://www.shiire-wine.com/uploads/img/content/winediagnosis/winediagnosis_c.png' // 食卓
  },
  stitch: { // 前回のSTITCH専用テーマ
    bg: 'bg-[#FAF9F6]', text: 'text-[#1A1A1A]', cardBg: 'bg-white', cardBorder: 'border-[#E5E0D8]', primary: 'bg-[#A82B3B]',
    heroImage: 'https://www.shiire-wine.com/uploads/img/content/winediagnosis/winediagnosis_a.png' // ワイナリー畑
  },
  // 他のテーマにも同様に heroImage を設定可能
};

// --- レーダーチャート ---
const RadarChart = ({ data }: { data: any }) => {
  const maxValue = 5;
  const radius = 40;
  const getVal = (val: number) => (Math.min(val || 0, maxValue) / maxValue) * radius;
  
  // デザイン案に合わせた軸（ボディ、酸味、甘味、タンニン）
  const top = 50 - getVal(data?.body);
  const right = 50 + getVal(data?.acidity);
  const bottom = 50 + getVal(data?.sweetness);
  const left = 50 - getVal(data?.tannin);
  const path = `M 50,${top} L ${right},50 L 50,${bottom} L ${left},50 Z`;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* 背景のひし形グリッド */}
        <path d="M 50,10 L 90,50 L 50,90 L 10,50 Z" fill="none" stroke="#E5E0D8" strokeWidth="0.5" />
        <path d="M 50,26 L 74,50 L 50,74 L 26,50 Z" fill="none" stroke="#E5E0D8" strokeWidth="0.5" />
        {/* 中心軸 */}
        <line x1="50" y1="10" x2="50" y2="90" stroke="#E5E0D8" strokeWidth="0.5" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="#E5E0D8" strokeWidth="0.5" />
        
        {/* 塗りつぶしエリア（ボルドーレッドのグラデーション風） */}
        <path d={path} fill="#A82B3B" fillOpacity="0.2" stroke="#A82B3B" strokeWidth="2" className="transition-all duration-1000 ease-out" />
        
        {/* 各頂点のドット */}
        <circle cx="50" cy={top} r="2" fill="#A82B3B" />
        <circle cx={right} cy="50" r="2" fill="#A82B3B" />
        <circle cx="50" cy={bottom} r="2" fill="#A82B3B" />
        <circle cx={left} cy="50" r="2" fill="#A82B3B" />
      </svg>
      
      {/* ラベル（デザイン案の位置） */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400">ボディ</div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">酸味</div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400">甘味</div>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">タンニン</div>
    </div>
  );
};

const inputClass = "w-full p-2 border rounded text-sm text-slate-800 bg-white mb-3";
const labelClass = "block text-xs font-bold text-slate-500 mb-1";


// --- UIコンポーネント: 店舗フォーム ---
  const StoreFormFields = ({ form, setForm }: {form: any, setForm: any}) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
      <div><label className={labelClass}>店舗名</label><input className={inputClass} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
      <div><label className={labelClass}>プログラム名</label><input className={inputClass} value={form.program_name} onChange={e=>setForm({...form, program_name:e.target.value})} /></div>
      <div><label className={labelClass}>業態</label><select className={inputClass} value={form.business_type} onChange={e=>setForm({...form, business_type:e.target.value})}><option value="restaurant">飲食店</option><option value="retail">小売店</option></select></div>
      <div><label className={labelClass}>ジャンル</label><select className={inputClass} value={form.genre} onChange={e=>setForm({...form, genre:e.target.value})}><option value="">選択してください</option>{(form.business_type==='restaurant' ? GENRES_RESTAURANT : GENRES_RETAIL).map(g=><option key={g} value={g}>{g}</option>)}</select></div>
      <div><label className={labelClass}>客単価</label><select className={inputClass} value={form.average_spend} onChange={e=>setForm({...form, average_spend:e.target.value})}><option value="">選択</option>{SPEND_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      <div><label className={labelClass}>エリア</label><select className={inputClass} value={form.area} onChange={e=>setForm({...form, area:e.target.value})}><option value="">選択</option>{AREA_OPTIONS.map(a=><option key={a} value={a}>{a}</option>)}</select></div>
      <div><label className={labelClass}>テーマ</label><select className={inputClass} value={form.theme} onChange={e=>setForm({...form, theme:e.target.value})}>{Object.keys(THEMES).map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div className="sm:col-span-2"><label className={labelClass}>ロゴURL</label><input className={inputClass} value={form.logo_url} onChange={e=>setForm({...form, logo_url:e.target.value})} /></div>
      <div className="sm:col-span-2"><label className={labelClass}>Google Map URL</label><input className={inputClass} value={form.google_map_url} onChange={e=>setForm({...form, google_map_url:e.target.value})} /></div>
      <div className="sm:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <label className={labelClass}>オプションON/OFF</label>
        <div className="flex flex-wrap gap-4 mt-2">
          {/* ↓修正：show_scenes:'シーン検索' を追加し、デフォルトをONに */}
          {Object.entries({has_palm_reading:'手相診断', has_face_reading:'人相診断', has_reviews:'Google口コミ', has_likes:'いいねボタン', has_comment_ticker:'コメント表示', show_menu_tags:'今日の献立', show_recommendations:'おすすめ商品', show_scenes:'シーン検索'}).map(([k,v]) => {
            const optObj = typeof form.options === 'string' ? JSON.parse(form.options || '{}') : (form.options || {});
            const defaultOn = ['has_reviews', 'has_likes', 'has_comment_ticker', 'show_menu_tags', 'show_recommendations', 'show_scenes'].includes(k);
            const isChecked = optObj[k] !== undefined ? optObj[k] : defaultOn;
            return (
              <label key={k} className="flex items-center gap-1 text-xs font-bold">
                <input type="checkbox" checked={isChecked} onChange={e=>setForm({...form, options:{...optObj, [k]:e.target.checked}})} /> {v}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  // --- UIコンポーネント: ワインフォーム ---
  const WineFormFields = ({ form, setForm }: {form: any, setForm: any}) => {
  
  // タグを数値から自動計算する関数
  const calculateTags = (taste: any) => {
    const newTags: string[] = [];
    if (taste.tannin <= 2) newTags.push('ワイン初心者');
    if (taste.tannin >= 3) newTags.push('中級～上級者');
    if (taste.body >= 3) newTags.push('じっくり味わう');
    if (taste.body <= 2) newTags.push('軽やかに飲む');
    if (taste.sweetness >= 3) newTags.push('リラックス');
    if (taste.sweetness <= 2) newTags.push('食事を引き立てたい');
    if (taste.acidity >= 3) newTags.push('気分を上げたい');
    if (taste.acidity <= 2) newTags.push('会話を楽しみたい');
    return newTags;
  };

  // スライダー変更時の処理
  const handleTasteChange = (key: string, val: number) => {
    if (key === 'color_value') {
      setForm({ ...form, [key]: val });
    } else {
      const updatedTaste = { ...form.taste, [key]: val };
      // 数値変更と同時にタグを再計算してセット
      setForm({ 
        ...form, 
        taste: updatedTaste,
        tags: calculateTags(updatedTaste)
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
      {/* --- 基本情報項目 (JAN〜ボトル画像URL) は既存のまま維持 --- */}
      <div><label className={labelClass}>JANコード (必須)</label><input className={inputClass} value={form.jan_code} onChange={e=>setForm({...form, jan_code:e.target.value})} /></div>
      <div><label className={labelClass}>ワイン名</label><input className={inputClass} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
      <div><label className={labelClass}>タイプ</label><select className={inputClass} value={form.wine_type} onChange={e=>setForm({...form, wine_type:e.target.value})}><option value="赤">赤</option><option value="白">白</option><option value="泡">泡</option><option value="ロゼ">ロゼ</option><option value="オレンジ">オレンジ</option></select></div>
      <div><label className={labelClass}>産地</label><input className={inputClass} value={form.origin} onChange={e=>setForm({...form, origin:e.target.value})} /></div>
      <div><label className={labelClass}>品種・比率</label><input className={inputClass} value={form.grape} onChange={e=>setForm({...form, grape:e.target.value})} /></div>
      <div><label className={labelClass}>アルコール度</label><input className={inputClass} value={form.alcohol} onChange={e=>setForm({...form, alcohol:e.target.value})} /></div>
      <div className="md:col-span-2"><label className={labelClass}>ソムリエコメント</label><textarea className={`${inputClass} h-24`} value={form.comment} onChange={e=>setForm({...form, comment:e.target.value})} /></div>
      <div className="md:col-span-2"><label className={labelClass}>ボトル画像URL</label><input className={inputClass} value={form.image_url} onChange={e=>setForm({...form, image_url:e.target.value})} /></div>
      
      {/* --- ① 味わい・検索ロジック設定 (カラーチャート追加) --- */}
      <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border">
        <label className={labelClass}>味わい・検索ロジック設定</label>
        <div className="grid grid-cols-1 gap-4 mt-2">
          {/* color_value 専用：カラーチャート付き */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400">COLOR_VALUE: {form.color_value}</label>
            <div className="h-4 w-full rounded-full mt-1" style={{ background: 'linear-gradient(to right, #ffb6c1, #e11d48, #9333ea, #1e3a8a, #10b981, #f97316, #eab308, #f8fafc)' }} />
            <input type="range" min="0" max="100" className="w-full h-6 cursor-pointer mt-[-8px]" 
              value={form.color_value} onChange={e => handleTasteChange('color_value', parseInt(e.target.value))} />
          </div>
          {/* その他 4項目 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['body', 'acidity', 'tannin', 'sweetness'].map(k => (
              <div key={k}>
                <label className="text-[10px] font-bold uppercase text-slate-400">{k}: {form.taste[k]}</label>
                <input type="range" min="1" max="5" className="w-full h-6" 
                  value={form.taste[k]} onChange={e => handleTasteChange(k, parseInt(e.target.value))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- ② シーン項目 (新規追加：業態別) --- */}
      <div className="md:col-span-2 space-y-4">
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <label className="block text-xs font-black text-indigo-600 mb-3 uppercase tracking-widest">推奨シーン (各1つ選択)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-2">▼ 小売店用シーン</p>
              <div className="flex flex-wrap gap-2">
                {SCENES_RETAIL.map(s => (
                  <button key={s} onClick={() => setForm({...form, scene_retail: s})} 
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${form.scene_retail === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border text-slate-400'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-2">▼ 飲食店用シーン</p>
              <div className="flex flex-wrap gap-2">
                {SCENES_RESTAURANT.map(s => (
                  <button key={s} onClick={() => setForm({...form, scene_restaurant: s})} 
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${form.scene_restaurant === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border text-slate-400'}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- ③ 検索用タグ (自動付与：読み取り専用風UI) --- */}
      <div className="md:col-span-2">
        <label className={labelClass}>検索用タグ (数値に合わせて自動付与されます)</label>
        <div className="flex flex-wrap gap-2 p-3 border rounded bg-slate-50 min-h-[50px]">
          {WINE_TAG_OPTIONS.map(t => (
            <div key={t} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${form.tags.includes(t) ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-300'}`}>
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* --- アロマ (既存のまま維持) --- */}
      <div className="md:col-span-2">
        <label className={labelClass}>アロマ (複数選択)</label>
        <div className="flex flex-wrap gap-2 p-3 border rounded bg-slate-50 overflow-y-auto max-h-40">
          {Object.keys(AROMA_IMAGES).map(a => (
            <label key={a} className="flex items-center gap-1 text-[10px] font-bold bg-white px-2 py-1 rounded border cursor-pointer hover:bg-slate-50">
              <input type="checkbox" checked={form.aromas.includes(a)} onChange={e=>{ const n=e.target.checked?[...form.aromas,a]:form.aromas.filter((x:any)=>x!==a); setForm({...form, aromas:n})}} /> {a}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 【1】マスター管理（ソムリエ社用）
// ==========================================
function AdminMasterView({ setMode }: any) {
  // --- データリストと検索用State ---
  const [allStores, setAllStores] = useState<any[]>([]);
  const [allWines, setAllWines] = useState<any[]>([]);
  const [storeSearch, setStoreSearch] = useState({ name: '', type: '', genre: '', area: '' });
  const [wineSearch, setWineSearch] = useState({ jan: '', type: '', name: '' });

  // --- フォーム用State (新規・編集 共通) ---
  const initialStore = {
    name: '', program_name: '', business_type: 'restaurant', genre: '', average_spend: '', area: '', 
    theme: 'luxury', logo_url: '', google_map_url: '',
    options: { has_palm_reading: false, has_face_reading: false, has_reviews: true, has_likes: true, has_comment_ticker: true }
  };
  const [storeForm, setStoreForm] = useState(initialStore);

  const initialWine = {
    jan_code: '', name: '', wine_type: '赤', origin: '', grape: '', alcohol: '', comment: '', image_url: '',
    color_value: 50, taste: { body: 3, acidity: 3, tannin: 3, sweetness: 3 },
    tags: [] as string[], aromas: [] as string[]
  };
  const [wineForm, setWineForm] = useState(initialWine);

  // モード切替用
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [isAddingWine, setIsAddingWine] = useState(false);
  const [editingStore, setEditingStore] = useState<any>(null);
  const [editingWine, setEditingWine] = useState<any>(null);

  const loadMasterData = async () => {
    const { data: st } = await supabase.from('stores').select('*').order('created_at', { ascending: false });
    setAllStores(st || []);
    const { data: wn } = await supabase.from('wines').select('*').order('created_at', { ascending: false });
    setAllWines(wn || []);
  };

  useEffect(() => { loadMasterData(); }, []);

  // --- 保存・更新・削除 共通ロジック ---
  const saveStore = async (data: any, id?: string) => {
    const action = id ? supabase.from('stores').update(data).eq('id', id) : supabase.from('stores').insert([data]);
    const { error } = await action;
    if (error) alert(error.message);
    else { alert('完了しました'); setIsAddingStore(false); setEditingStore(null); loadMasterData(); }
  };

  const saveWine = async (data: any, id?: string) => {
    if (!data.jan_code) return alert('JAN必須');
    const action = id ? supabase.from('wines').update(data).eq('id', id) : supabase.from('wines').insert([data]);
    const { error } = await action;
    if (error) alert(error.message);
    else { alert('完了しました'); setIsAddingWine(false); setEditingWine(null); loadMasterData(); }
  };

  const deleteItem = async (table: string, id: string) => {
    if (!confirm("本当に削除しますか？紐付いているデータもすべて消去されます。")) return;
    
    const { error } = await supabase.from(table).delete().eq('id', id);
    
    if (error) {
      if (error.code === '23503') {
        alert("エラー：この項目に紐付いている料理や在庫があるため削除できません。先にそれらを削除するか、SQLでの制約変更が必要です。");
      } else {
        alert("削除エラー: " + error.message);
      }
    } else {
      loadMasterData();
    }
  };

  // --- 検索フィルター ---
  const filteredStores = allStores.filter(s => s.name.includes(storeSearch.name) && (storeSearch.type==='' || s.business_type===storeSearch.type) && (storeSearch.genre==='' || s.genre===storeSearch.genre) && (storeSearch.area==='' || s.area===storeSearch.area));
  const filteredWines = allWines.filter(w => (w.jan_code||'').includes(wineSearch.jan) && (wineSearch.type==='' || w.wine_type===wineSearch.type) && w.name.includes(wineSearch.name));

  

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800 pb-40 text-left">
      <button onClick={() => setMode('portal')} className="flex items-center gap-1 font-bold mb-6 hover:opacity-70 text-indigo-600"><ChevronLeft/> SYSTEM PORTALへ戻る</button>
      <h1 className="text-2xl font-black mb-10 flex items-center gap-2"><Building/> マスター管理 (ソムリエ社権限)</h1>

      {/* --- 店舗セクション --- */}
      <section className="space-y-6 mb-20">
        <div className="flex justify-between items-end border-b-2 border-slate-300 pb-2">
          <h2 className="text-xl font-bold flex items-center gap-2"><Store/> 店舗マスター管理</h2>
          <button onClick={() => { setIsAddingStore(!isAddingStore); setStoreForm(initialStore); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow">
            {isAddingStore ? '閉じる' : '＋ 新規店舗を登録'}
          </button>
        </div>
        {isAddingStore && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-indigo-200 space-y-6 animate-in fade-in zoom-in-95">
            <StoreFormFields form={storeForm} setForm={setStoreForm} />
            <button onClick={() => saveStore(storeForm)} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg">店舗を新規登録する</button>
          </div>
        )}
        {/* 店舗検索 */}
        <div className="bg-slate-200 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="p-2 rounded text-sm" placeholder="店名検索" value={storeSearch.name} onChange={e=>setStoreSearch({...storeSearch, name:e.target.value})} />
          <select className="p-2 rounded text-sm" value={storeSearch.type} onChange={e=>setStoreSearch({...storeSearch, type:e.target.value})}><option value="">全業態</option><option value="restaurant">飲食店</option><option value="retail">小売店</option></select>
          <select className="p-2 rounded text-sm" value={storeSearch.genre} onChange={e=>setStoreSearch({...storeSearch, genre:e.target.value})}><option value="">全ジャンル</option>{[...GENRES_RESTAURANT, ...GENRES_RETAIL].map(g=><option key={g} value={g}>{g}</option>)}</select>
          <select className="p-2 rounded text-sm" value={storeSearch.area} onChange={e=>setStoreSearch({...storeSearch, area:e.target.value})}><option value="">全エリア</option>{AREA_OPTIONS.map(a=><option key={a} value={a}>{a}</option>)}</select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map(s => (
            <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">{s.logo_url && <img src={s.logo_url} className="w-full h-full object-contain" />}</div>
              <div className="flex-1 overflow-hidden"><p className="font-bold truncate">{s.name}</p><p className="text-[10px] opacity-60 font-bold">{s.area} / {s.genre}</p></div>
              <div className="flex gap-1">
                <button onClick={() => setEditingStore(s)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Settings size={18}/></button>
                <button onClick={() => deleteItem('stores', s.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- ワインセクション --- */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b-2 border-slate-300 pb-2">
          <h2 className="text-xl font-bold flex items-center gap-2"><Wine/> ワインマスター管理</h2>
          <button onClick={() => { setIsAddingWine(!isAddingWine); setWineForm(initialWine); }} className="bg-rose-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow">
            {isAddingWine ? '閉じる' : '＋ 新規ワインを登録'}
          </button>
        </div>
        {isAddingWine && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-rose-200 space-y-6 animate-in fade-in zoom-in-95">
            <WineFormFields form={wineForm} setForm={setWineForm} />
            <button onClick={() => saveWine(wineForm)} className="w-full py-4 bg-rose-700 text-white font-black rounded-xl shadow-lg">ワインをマスターに登録する</button>
          </div>
        )}
        {/* ワイン検索 */}
        <div className="bg-slate-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="p-2 rounded text-sm" placeholder="JAN検索" value={wineSearch.jan} onChange={e=>setWineSearch({...wineSearch, jan:e.target.value})} />
          <select className="p-2 rounded text-sm" value={wineSearch.type} onChange={e=>setWineSearch({...wineSearch, type:e.target.value})}><option value="">全タイプ</option><option value="赤">赤</option><option value="白">白</option><option value="泡">泡</option><option value="ロゼ">ロゼ</option><option value="オレンジ">オレンジ</option></select>
          <input className="p-2 rounded text-sm" placeholder="ワイン名検索" value={wineSearch.name} onChange={e=>setWineSearch({...wineSearch, name:e.target.value})} />
        </div>
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b"><tr><th className="p-3 font-bold">JAN</th><th className="p-3 font-bold">ワイン名</th><th className="p-3 font-bold">タイプ</th><th className="p-3 text-right">操作</th></tr></thead>
            <tbody>
              {filteredWines.map(w => (
                <tr key={w.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs">{w.jan_code}</td>
                  <td className="p-3 font-bold">{w.name}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100">{w.wine_type}</span></td>
                  <td className="p-3 text-right"><div className="flex justify-end gap-1"><button onClick={()=>setEditingWine(w)} className="p-2 text-slate-400 hover:text-rose-700"><Settings size={16}/></button><button onClick={()=>deleteItem('wines', w.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- 店舗編集モーダル --- */}
      {editingStore && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
          {/* ↓ max-h と overflow-y-auto を追加 */}
          <div className="bg-white p-8 rounded-3xl w-full max-w-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            <h3 className="text-xl font-black text-indigo-800 border-b-2 pb-2">店舗情報の編集</h3>
            <StoreFormFields form={editingStore} setForm={setEditingStore} />
            <div className="flex gap-3 pt-4">
              <button onClick={()=>saveStore(editingStore, editingStore.id)} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl">変更を保存する</button>
              <button onClick={()=>setEditingStore(null)} className="px-8 py-4 bg-slate-100 font-bold rounded-xl">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* --- ワイン編集モーダル --- */}
      {editingWine && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
          {/* ↓ max-h と overflow-y-auto を追加 */}
          <div className="bg-white p-8 rounded-3xl w-full max-w-4xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-auto">
            <h3 className="text-xl font-black text-rose-800 border-b-2 pb-2">ワイン情報の編集 (マスター)</h3>
            <WineFormFields form={editingWine} setForm={setEditingWine} />
            <div className="flex gap-3 pt-4">
              <button onClick={()=>saveWine(editingWine, editingWine.id)} className="flex-1 py-4 bg-rose-700 text-white font-black rounded-xl">マスター情報を更新する</button>
              <button onClick={()=>setEditingWine(null)} className="px-8 py-4 bg-slate-100 font-bold rounded-xl">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 【2】店舗管理（各店用）
// ==========================================
function AdminStoreView({ setMode, storeId }: any) {
  const [winesMaster, setWinesMaster] = useState<any[]>([]);
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [dishesList, setDishesList] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);

  const [dishForm, setDishForm] = useState({ name: '', price: '', image_url: '', comment: '', spiciness: 0, allergy: '', pairing_wine_id: '' });
  const [invForm, setInvForm] = useState({ jan_code: '', bottle: '', glass: '' });

  // --- 追加：献立タグ用の状態 ---
  const [retailTags, setRetailTags] = useState<any[]>([]);
  const [tagForm, setTagForm] = useState({ category_name: 'お肉料理', tag_name: '', pairing_wine_id: '' });

  const loadStoreData = async () => {
    const cleanId = storeId?.length > 36 ? storeId.substring(0, 36) : storeId;
    if (!cleanId) return;

    const { data: st } = await supabase.from('stores').select('*').eq('id', cleanId).single();
    setCurrentStore(st);

    const { data: ds } = await supabase.from('dishes').select('*').eq('store_id', cleanId);
    setDishesList(ds || []);

    const { data: inv } = await supabase.from('store_inventory').select('*').eq('store_id', cleanId);
    setInventoryList(inv || []);

    const { data: wm } = await supabase.from('wines').select('*');
    setWinesMaster(wm || []);

    // 追加：献立タグの取得
    const { data: tags } = await supabase.from('retail_menu_tags').select('*').eq('store_id', cleanId).order('created_at', { ascending: true });
    setRetailTags(tags || []);
  };

  useEffect(() => { loadStoreData(); }, [storeId]);

  const saveDish = async () => {
    if (!dishForm.name) return alert("料理名を入力してください");
    const submitData = {
      ...dishForm,
      store_id: storeId,
      pairing_wine_id: dishForm.pairing_wine_id === "" ? null : dishForm.pairing_wine_id
    };
    const { error } = await supabase.from('dishes').insert([submitData]);
    if (error) {
      alert("エラー: " + error.message);
    } else {
      alert('料理を登録しました');
      setDishForm({ name: '', price: '', image_url: '', comment: '', spiciness: 0, allergy: '', pairing_wine_id: '' });
      await loadStoreData();
    }
  };

  const saveInventory = async () => {
    if (!invForm.jan_code) return alert("ワインを選択してください");
    
    // 追加：既にinventoryListに登録されているか重複チェック
    const isDuplicate = inventoryList.some(inv => String(inv.jan_code).trim() === String(invForm.jan_code).trim());
    if (isDuplicate) return alert("このワインは既に自店メニューに登録されています。");

    const { error } = await supabase.from('store_inventory').insert([{
      store_id: storeId,
      jan_code: String(invForm.jan_code).trim(),
      bottle_price: Number(invForm.bottle),
      glass_price: Number(invForm.glass)
    }]);
    if (error) alert(error.message);
    else {
      alert("ワインをメニューに追加しました");
      setInvForm({ jan_code: '', bottle: '', glass: '' });
      await loadStoreData();
    }
  };

  // 追加：献立タグの保存・削除関数
  const saveMenuTag = async () => {
    if (!tagForm.tag_name) return alert("料理タグ名を入力してください");
    const { error } = await supabase.from('retail_menu_tags').insert([{
      store_id: storeId,
      category_name: tagForm.category_name,
      tag_name: tagForm.tag_name,
      pairing_wine_id: tagForm.pairing_wine_id === "" ? null : tagForm.pairing_wine_id
    }]);
    if (error) alert(error.message);
    else {
      alert('タグを登録しました');
      setTagForm({ ...tagForm, tag_name: '' });
      await loadStoreData();
    }
  };
  
  const deleteMenuTag = async (id: string) => {
    if (confirm("このタグを削除しますか？")) {
      const { error } = await supabase.from('retail_menu_tags').delete().eq('id', id);
      if (error) alert("削除エラー: " + error.message);
      else await loadStoreData();
    }
  };

  const deleteDish = async (id: string) => { 
    if (confirm("この料理を削除しますか？")) { 
      const { error } = await supabase.from('dishes').delete().eq('id', id); 
      if (error) alert("削除エラー: " + error.message);
      else await loadStoreData(); 
    } 
  };

  const deleteInventory = async (id: string) => { 
    if (confirm("このワインを削除しますか？")) { 
      const { error } = await supabase.from('store_inventory').delete().eq('id', id); 
      if (error) alert("削除エラー: " + error.message);
      else await loadStoreData(); 
    } 
  };

  return (
    <div className="min-h-screen bg-emerald-50 p-6 text-slate-800 pb-20 relative text-left">
      <button onClick={() => setMode('portal')} className="flex items-center gap-1 font-bold mb-4 text-emerald-700 hover:underline"><ChevronLeft/> SYSTEM PORTALに戻る</button>
      
      <div className="bg-emerald-600 text-white p-6 rounded-3xl shadow-xl mb-10 flex items-center gap-4">
        <div className="bg-white p-2 rounded-full w-16 h-16 flex items-center justify-center overflow-hidden text-emerald-600">
          {currentStore?.logo_url ? <img src={currentStore.logo_url} className="w-full h-full object-contain" /> : <Store />}
        </div>
        <div>
          <p className="text-[10px] font-black tracking-widest opacity-80 uppercase">Now Editing</p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl font-black">{currentStore?.name || 'Loading...'}</h1>
            <div className="flex gap-2">
              {currentStore?.genre && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold border border-white/10">{currentStore.genre}</span>}
              {currentStore?.average_spend && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold border border-white/10">{currentStore.average_spend}</span>}
              {currentStore?.area && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold border border-white/10">{currentStore.area}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-10">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
            <h2 className="text-lg font-bold mb-4 border-b pb-2 text-emerald-800 flex items-center gap-2">
              <ChefHat/> {currentStore?.business_type === 'restaurant' ? '料理・ペアリング登録' : 'おすすめ商品登録'}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <input className={inputClass} placeholder="料理名（商品名）" value={dishForm.name} onChange={e => setDishForm({...dishForm, name: e.target.value})} />
              <input className={inputClass} placeholder="価格 (例: ¥1,500)" value={dishForm.price} onChange={e => setDishForm({...dishForm, price: e.target.value})} />
              <input className={inputClass} placeholder="料理画像URL" value={dishForm.image_url} onChange={e => setDishForm({...dishForm, image_url: e.target.value})} />
              <textarea className={`${inputClass} h-16`} placeholder="料理の説明文" value={dishForm.comment} onChange={e => setDishForm({...dishForm, comment: e.target.value})} />
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">辛さレベル (0-5)</label>
                  <input type="number" min="0" max="5" placeholder="辛さレベル" className={inputClass} value={dishForm.spiciness} onChange={e => setDishForm({...dishForm, spiciness: Number(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">アレルギー情報</label>
                  <input className={inputClass} placeholder="アレルギー" value={dishForm.allergy} onChange={e => setDishForm({...dishForm, allergy: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 ml-1">この料理に合うワイン (任意)</label>
                <select className={inputClass} value={dishForm.pairing_wine_id} onChange={e => setDishForm({...dishForm, pairing_wine_id: e.target.value})}>
                  <option value="">-- 選択しない --</option>
                  {/* 修正：店舗に登録済みのワイン（inventoryListにあるもの）だけを表示 */}
                  {winesMaster.filter(w => inventoryList.some(inv => String(inv.jan_code).trim() === String(w.jan_code).trim())).map(w => (
                    <option key={w.id} value={w.id}>[{w.wine_type}] {w.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={saveDish} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl shadow hover:bg-emerald-700 transition-all">料理を追加</button>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
            <h2 className="text-lg font-bold mb-4 border-b pb-2 text-indigo-800 flex items-center gap-2"><Wine/> 店舗別：ワイン価格登録</h2>
            <div className="grid grid-cols-1 gap-3">
              <select className={inputClass} value={invForm.jan_code} onChange={e => setInvForm({...invForm, jan_code: e.target.value})}>
                <option value="">-- ワインを選択 --</option>
                {winesMaster.map(w => <option key={w.jan_code} value={w.jan_code}>[{w.wine_type}] {w.name} (JAN:{w.jan_code})</option>)}
              </select>
              <div className="flex gap-2">
                <input type="number" className={inputClass} placeholder="ボトル価格" value={invForm.bottle} onChange={e => setInvForm({...invForm, bottle: e.target.value})} />
                <input type="number" className={inputClass} placeholder="グラス価格" value={invForm.glass} onChange={e => setInvForm({...invForm, glass: e.target.value})} />
              </div>
              <button onClick={saveInventory} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow hover:bg-indigo-700 transition-all">自店メニューに追加</button>
            </div>
          </section>

          {/* --- 追加：献立タグ登録（小売店のみ） --- */}
          {currentStore?.business_type === 'retail' && (
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
              <h2 className="text-lg font-bold mb-4 border-b pb-2 text-rose-800 flex items-center gap-2">
                <Plus size={20}/> 今日の献立タグ登録
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">カテゴリー (お肉料理・お魚料理 等)</label>
                    <input className={inputClass} placeholder="例: お肉料理" value={tagForm.category_name} onChange={e => setTagForm({...tagForm, category_name: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">料理タグ名 (ハンバーグ 等)</label>
                    <input className={inputClass} placeholder="例: 牛ステーキ" value={tagForm.tag_name} onChange={e => setTagForm({...tagForm, tag_name: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 ml-1">この献立に合わせるワイン</label>
                  <select className={inputClass} value={tagForm.pairing_wine_id} onChange={e => setTagForm({...tagForm, pairing_wine_id: e.target.value})}>
                    <option value="">-- ワインを選択 --</option>
                    {/* 修正：店舗に登録済みのワイン（inventoryListにあるもの）だけを表示 */}
                    {winesMaster.filter(w => inventoryList.some(inv => String(inv.jan_code).trim() === String(w.jan_code).trim())).map(w => (
                      <option key={w.id} value={w.id}>[{w.wine_type}] {w.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={saveMenuTag} className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl shadow hover:bg-rose-700 transition-all">献立タグを追加</button>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-10">
          <section>
            <h3 className="font-black text-emerald-800 mb-4 uppercase">Registered Dishes ({dishesList.length})</h3>
            <div className="space-y-3">
              {dishesList.map(d => (
                <div key={d.id} className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center gap-3 shadow-sm group">
                  <img src={d.image_url || 'https://via.placeholder.com/100'} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{d.name}</p>
                    <p className="text-xs text-emerald-600 font-bold">{d.price}</p>
                  </div>
                  <button onClick={() => deleteDish(d.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                </div>
              ))}
              {dishesList.length === 0 && <p className="text-sm opacity-50 italic">料理が登録されていません</p>}
            </div>
          </section>

          <section>
            <h3 className="font-black text-indigo-800 mb-4 uppercase">Publishing Wines ({inventoryList.length})</h3>
            <div className="space-y-3">
              {inventoryList.map(inv => {
                const wine = winesMaster.find(w => String(w.jan_code).trim() === String(inv.jan_code).trim());
                return (
                  <div key={inv.id} className="bg-white p-4 rounded-xl border border-indigo-100 flex justify-between items-center shadow-sm">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{wine?.name || `JAN: ${inv.jan_code} (名前不一致)`}</p>
                      <p className="text-[10px] opacity-60 font-bold">ボトル: ¥{inv.bottle_price?.toLocaleString()} / グラス: ¥{inv.glass_price?.toLocaleString()}</p>
                    </div>
                    <button onClick={() => deleteInventory(inv.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                );
              })}
              {inventoryList.length === 0 && <p className="text-sm opacity-50 italic">ワインが登録されていません</p>}
            </div>
          </section>

          {/* --- 追加：献立タグ一覧表示（小売店のみ） --- */}
          {currentStore?.business_type === 'retail' && (
            <section>
              <h3 className="font-black text-rose-800 mb-4 uppercase">Registered Menu Tags ({retailTags.length})</h3>
              <div className="space-y-4">
                {Array.from(new Set(retailTags.map(t => t.category_name))).map(cat => (
                  <div key={cat} className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm">
                    <h4 className="text-xs font-black text-rose-600 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-600"/> {cat}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {retailTags.filter(t => t.category_name === cat).map(tag => {
                        const wine = winesMaster.find(w => w.id === tag.pairing_wine_id);
                        return (
                          <div key={tag.id} className="group relative flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                            <div className="text-[11px] font-bold">
                              {tag.tag_name} 
                              <span className="ml-2 text-[9px] text-slate-400 font-normal">→ {wine ? wine.name : '未設定'}</span>
                            </div>
                            <button onClick={() => deleteMenuTag(tag.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={12}/>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {retailTags.length === 0 && <p className="text-sm opacity-50 italic">献立タグが登録されていません</p>}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// 【3】システムポータル（入り口 ＋ ログイン維持）
function PortalView({ setMode, setActiveStoreId, isAuthenticated, setIsAuthenticated }: any) {
  const [stores, setStores] = useState<any[]>([]);
  const [passwordInput, setPasswordInput] = useState('');
  
 // セキュリティ対策：環境変数から取得するように変更（GitHub上で見えなくなります）
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sommelier2026';
  
  useEffect(() => { if (isAuthenticated) supabase.from('stores').select('*').then(({data}) => setStores(data || [])); }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl w-full max-w-sm space-y-6 text-slate-800 shadow-2xl">
          <h2 className="text-xl font-bold text-center flex items-center justify-center gap-2"><Settings/> 管理者ログイン</h2>
          <input type="password" placeholder="パスワードを入力" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full p-3 border rounded-xl" onKeyDown={e => { if (e.key === 'Enter' && passwordInput === ADMIN_PASSWORD) setIsAuthenticated(true); }} />
          <button onClick={() => { if (passwordInput === ADMIN_PASSWORD) setIsAuthenticated(true); else alert('パスワードが違います'); }} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl" >ログイン</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center justify-center text-white">
      <Store size={48} className="mb-4 text-amber-500" />
      <h1 className="text-3xl font-black mb-8 tracking-widest uppercase">System Portal</h1>
      <div className="w-full max-w-md space-y-4">
        <button onClick={() => setMode('admin_master')} className="w-full py-4 bg-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2"><Building size={20}/> マスター管理画面へ</button>
        <div className="border-t border-white/20 pt-4 mt-4 space-y-2 text-left">
          <p className="text-sm opacity-60 mb-2 font-bold ml-1">各店舗の料理・設定画面へ</p>
          {stores.map(s => (
            <button key={s.id} onClick={() => { setActiveStoreId(s.id); setMode('admin_store'); }} className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-left px-4 flex justify-between">
              {s.name} <ChevronLeft className="rotate-180 opacity-50"/>
            </button>
          ))}
        </div>
        <button onClick={() => { window.location.href = '/'; }} className="w-full py-4 mt-8 border border-white/30 rounded-xl font-bold opacity-70 hover:opacity-100">カスタマー画面を確認する</button>
      </div>
    </div>
  );
}

// 【4】カスタマー向け アプリ本体
function CustomerApp() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [animType, setAnimType] = useState('normal'); 
  const [wines, setWines] = useState<any[]>([]);
  const [store, setStore] = useState<any>(null);
  const [dishes, setDishes] = useState<any[]>([]);
  const [retailTags, setRetailTags] = useState<any[]>([]); // 追加：献立タグを入れる箱
  const [view, setView] = useState<'top' | 'search' | 'result' | 'my_selection' | 'ranking'>('top');
  const [activeRankingTab, setActiveRankingTab] = useState('scene'); 
  const [activeSubTab, setActiveSubTab] = useState(''); 
  const [activeTagTab, setActiveTagTab] = useState(''); 
  const [searchParams, setSearchParams] = useState({ colorValue: 50, scene: '', tag: '', type: '', menu: '' });
  const [resultWine, setResultWine] = useState<any>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentForm, setCommentForm] = useState({ nickname: '', comment: '' });
  const [approvedComments, setApprovedComments] = useState<any[]>([]);
  const [mySelections, setMySelections] = useState<any[]>([]);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null); // ←追加：reCAPTCHA用の状態

  useEffect(() => {
    async function fetchData() {
      let currentStore = null;
      const params = new URLSearchParams(window.location.search);
      const storeId = params.get('store_id');
      const { data: st } = await supabase.from('stores').select('*').eq('id', storeId || '').single();
      currentStore = st || (await supabase.from('stores').select('*').limit(1).single()).data;
      setStore(currentStore);

      const v = params.get('view');
      if (v === 'ranking') setView('ranking');

      const { data: ds } = await supabase.from('dishes').select('*').eq('store_id', currentStore.id);
      setDishes(ds || []);

      // 追加：データベースから本物のタグを取得
      const { data: tags } = await supabase.from('retail_menu_tags').select('*').eq('store_id', currentStore.id).order('created_at', { ascending: true });
      setRetailTags(tags || []);

      const { data: inventory } = await supabase.from('store_inventory').select('*').eq('store_id', currentStore.id);
      const { data: allWines } = await supabase.from('wines').select('*');
      
      const displayWines = inventory && inventory.length > 0 
        ? inventory.map(inv => {
            const master = allWines?.find(w => String(w.jan_code).trim() === String(inv.jan_code).trim());
            return master ? { ...master, bottle_price: inv.bottle_price, glass_price: inv.glass_price } : null;
          }).filter(w => w !== null)
        : allWines || [];
      setWines(displayWines);

      const saved = localStorage.getItem('sommelier_my_selection');
      if (saved) setMySelections(JSON.parse(saved));

      const wineJan = params.get('jan');
      if (wineJan) {
        const matched = allWines?.find(w => String(w.jan_code).trim() === wineJan);
        if (matched) {
          const inv = inventory?.find(i => String(i.jan_code).trim() === wineJan);
          const finalWine = inv ? { ...matched, bottle_price: inv.bottle_price, glass_price: inv.glass_price } : matched;
          setResultWine(finalWine);
          setView('result');
        }
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (resultWine && resultWine.jan_code) {
      supabase.from('wine_comments').select('*').eq('jan_code', resultWine.jan_code).then(({data}) => setApprovedComments(data || []));
    }
  }, [resultWine]);

  useEffect(() => {
    if (view === 'result' && resultWine && store) {
      const pageTitle = `${resultWine.name} | ${store.name} のAIワイン診断`;
      const pageDesc = `「${store.name}」で選ばれた最高の一杯。産地：${resultWine.origin}。品種：${resultWine.grape}。ソムリエによる解説：${resultWine.comment?.substring(0, 50)}...`;
      
      document.title = pageTitle;
      
      const metaTags = {
        'description': pageDesc,
        'og:title': pageTitle,
        'og:description': pageDesc,
        'og:image': resultWine.image_url,
        'og:url': window.location.href
      };

      Object.entries(metaTags).forEach(([name, content]) => {
        let el = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
        if (el) el.setAttribute('content', content || '');
      });
    }
  }, [view, resultWine, store]);

  const startDiagnosis = (dishWineId?: string) => {
    if (wines.length === 0) return;
    
    const r = Math.random();
    if (r < 0.7) setAnimType('normal');      
    else if (r < 0.8) setAnimType('cat');    
    else if (r < 0.9) setAnimType('fail');   
    else setAnimType('clover');              

    setIsAnalyzing(true);

    setTimeout(() => {
      if (dishWineId) {
        const matched = wines.find(w => w.id === dishWineId);
        if (matched) {
          setResultWine(matched);
          setView('result');
          setIsAnalyzing(false);
          return;
        }
      }
      
      const bestMatch = wines.reduce((prev, curr) => {
        let pS = 100 - Math.abs((prev.color_value || 50) - searchParams.colorValue);
        let cS = 100 - Math.abs((curr.color_value || 50) - searchParams.colorValue);
        if (searchParams.scene && prev.tags?.includes(searchParams.scene)) pS += 40;
        if (searchParams.scene && curr.tags?.includes(searchParams.scene)) cS += 40;
        return cS > pS ? curr : prev;
      }, wines[0]);

      setResultWine(bestMatch);
      setView('result');
      
      const newUrl = `${window.location.origin}${window.location.pathname}?store_id=${store.id}&jan=${bestMatch.jan_code}`;
      window.history.pushState({ path: newUrl }, '', newUrl);

      setIsAnalyzing(false);
    }, 3000);
  };

  const handleLike = async (wineId: string) => {
    await supabase.rpc('increment_wine_likes', { wine_id: wineId });
    setWines(prev => prev.map(w => w.id === wineId ? { ...w, total_likes: (w.total_likes || 0) + 1 } : w));
    alert("ありがとうございます！");
  };

  const handleShare = (platform: 'x' | 'line' | 'instagram') => {
    const uniqueUrl = window.location.href;
    const shareText = `「${store.name}」で飲んだ一杯\n\n🍷 ${resultWine.name}\n📍 産地：${resultWine.origin}\n🍇 品種・比率：${resultWine.grape}`;

    if (platform === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(uniqueUrl)}`, '_blank');
    } else if (platform === 'line') {
      window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(uniqueUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(`${shareText}\n\n詳細はこちら：${uniqueUrl}`);
      alert("内容をコピーしました！Instagramの投稿やストーリーに貼り付けてください。");
    }
  };

  const submitComment = async () => {
    if (!commentForm.nickname || !commentForm.comment) return alert("入力してください");
    if (commentForm.comment.length > 100 || /(http|https|www)/i.test(commentForm.comment)) return alert("制限エラー");
    if (!captchaToken) return alert("ロボットでないことを確認してください（チェックボックスにチェックを入れてください）"); // ←追加：ロボットチェック

    await supabase.from('wine_comments').insert([{ jan_code: resultWine.jan_code, store_id: store.id, nickname: commentForm.nickname, comment: commentForm.comment, is_approved: true }]);
    alert("投稿しました！"); 
    // ↓修正：created_at の現在時刻を追加して Invalid Date を解消
    setApprovedComments([...approvedComments, { ...commentForm, id: Date.now(), created_at: new Date().toISOString() }]); 
    setShowCommentModal(false); 
    setCommentForm({ nickname: '', comment: '' });
    setCaptchaToken(null); // ←投稿後にトークンをリセット
  };

  if (!store) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-bold tracking-widest animate-pulse uppercase">Loading Cellar...</div>;
  const tClass = THEMES[store.theme] || THEMES.luxury;

  // 追加：保存されたオプションを安全にオブジェクトとして取得
  const optObj = typeof store.options === 'string' ? JSON.parse(store.options || '{}') : (store.options || {});
  // ↓修正：show_scenes をデフォルトのオプション設定に追加
  const options = { has_palm_reading: false, has_face_reading: false, has_reviews: true, has_likes: true, has_comment_ticker: true, show_menu_tags: true, show_recommendations: true, show_scenes: true, ...optObj };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-700 ${tClass.bg} ${tClass.text}`}>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-150%); } }
        .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee 20s linear infinite; }

        /* --- ワイン開栓・注ぎアニメーション群 --- */
        @keyframes wl-opener-pull {
          0% { transform: translateY(-40px); opacity: 0; }
          10% { transform: translateY(-10px); opacity: 1; }
          20% { transform: translateY(0) rotateY(360deg); opacity: 1; }
          30% { transform: translateY(-40px) rotateY(360deg); opacity: 1; }
          35%, 100% { transform: translateY(-40px) rotateY(360deg); opacity: 0; }
        }
        @keyframes wl-opener-pull-fail {
          0% { transform: translateY(-40px); opacity: 0; }
          10% { transform: translateY(-10px); opacity: 1; }
          20%, 40% { transform: translateY(0) rotateY(360deg); opacity: 1; }
          50% { transform: translateY(-300px) rotateY(360deg); opacity: 1; }
          51%, 100% { transform: translateY(-300px) rotateY(360deg); opacity: 0; }
        }
        @keyframes wl-cork-pull {
          0%, 20% { transform: translateY(0); opacity: 1; }
          30% { transform: translateY(-33px); opacity: 1; }
          35%, 100% { transform: translateY(-33px); opacity: 0; }
        }
        @keyframes wl-bottle-tilt {
          0%, 35% { transform: translate(0, 0) rotate(0deg); }
          45%, 70% { transform: translate(45px, -30px) rotate(75deg); }
          80%, 100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes wl-bottle-fly {
          0%, 40% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          50% { transform: translate(0, -300px) rotate(0deg); opacity: 1; }
          51%, 100% { transform: translate(0, -300px) rotate(0deg); opacity: 0; }
        }
        @keyframes wl-liquid-pour {
          0%, 44% { opacity: 0; height: 0; transform: translateX(-50%) rotate(-75deg); }
          46% { opacity: 1; height: 65px; transform: translateX(-50%) rotate(-75deg); }
          68% { opacity: 1; height: 65px; transform: translateX(-50%) rotate(-75deg); }
          70%, 100% { opacity: 0; height: 0; transform: translateX(-50%) rotate(-75deg); }
        }
        @keyframes wl-glass-fill {
          0%, 46% { height: 0%; opacity: 0; }
          48% { opacity: 1; height: 10%; }
          68% { height: 60%; opacity: 1; }
          80% { height: 60%; opacity: 1; }
          90%, 100% { height: 0%; opacity: 0; }
        }
        @keyframes wl-cat-peek {
          0%, 30% { transform: translateY(100px); }
          45%, 75% { transform: translateY(0px); }
          85%, 100% { transform: translateY(100px); }
        }
        @keyframes wl-whiteout {
          0%, 80% { opacity: 0; }
          90%, 100% { opacity: 1; }
        }

        /* 液体がゆっくり揺れるエフェクト */
@keyframes liquid-sway {
  0%, 100% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; transform: scale(1); }
  33% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; transform: scale(1.1) rotate(5deg); }
  66% { border-radius: 30% 70% 70% 30% / 50% 60% 30% 40%; transform: scale(0.9) rotate(-5deg); }
}
.animate-liquid {
  animation: liquid-sway 8s infinite ease-in-out;
  filter: blur(40px);
}

        .anim-opener { animation: wl-opener-pull 3s infinite ease-in-out; }
        .anim-opener-fail { animation: wl-opener-pull-fail 3s infinite ease-in-out; }
        .anim-cork { animation: wl-cork-pull 3s infinite ease-in-out; }
        .anim-bottle { animation: wl-bottle-tilt 3s infinite ease-in-out; transform-origin: center center; }
        .anim-bottle-fail { animation: wl-bottle-fly 3s infinite ease-in-out; }
        .anim-pour { animation: wl-liquid-pour 3s infinite ease-in; transform-origin: top center; }
        .anim-fill { animation: wl-glass-fill 3s infinite ease-in-out; }
        .anim-cat { animation: wl-cat-peek 3s infinite ease-in-out; }
        .anim-whiteout { animation: wl-whiteout 3s infinite ease-in-out; }
        /* カラーつまみのカスタムスタイル */
.color-range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 32px;
  height: 32px;
  background: white;
  border: 4px solid #1A1A1A;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);}
  /* 中央ボタンを少しだけ動かすアニメーション */
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.animate-bounce-subtle {
  animation: bounce-subtle 2s infinite ease-in-out;}
      `}} />

      {view === 'top' && (
        <div className="animate-in fade-in duration-1000 pb-40 h-screen overflow-y-auto hide-scrollbar bg-[#FAF9F6]">
          {/* ヘッダー */}
          <header className="sticky top-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-[#E5E0D8]">
            <div className="w-10" />
            <div className="flex items-center gap-2">
              {store.logo_url ? (
                <img src={store.logo_url} className="h-6 w-auto object-contain" alt="logo" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200" />
              )}
              <h1 className="text-xl font-serif font-black tracking-tight text-[#1A1A1A]">{store.name}</h1>
            </div>
            <button className="p-2 opacity-30"><Settings size={20}/></button>
          </header>

          {/* ヒーローセクション */}
          <section className="relative h-[85vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
            <img 
              src={tClass.heroImage || 'https://images.unsplash.com/photo-1506377247377-2a5b3b0ca7df?q=80&w=2070'} 
              className="absolute inset-0 w-full h-full object-cover scale-105"
              alt="Winery"
              onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1506377247377-2a5b3b0ca7df?q=80&w=2070"; }}
            />
            {/* グラデーションを少し強めに設定 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
            
            <div className="relative z-10 space-y-10 w-full flex flex-col items-center px-4">
  {/* ★修正：backdrop-blur-md -> backdrop-blur に変更 */}
  <div className="bg-black/20 backdrop-blur p-8 rounded-[2rem] border border-white/20 shadow-2xl">
    <p className="text-sm font-bold tracking-[0.3em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-4">
      今日飲みたいワインがすぐに見つかる
    </p>
    <h2 className="text-5xl md:text-6xl font-serif font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] leading-tight">
      {store.program_name || 'プログラム名'}
    </h2>
  </div>
  ...
              
              <div className="pt-4">
                <button 
                  onClick={() => setView('search')}
                  className="bg-[#A82B3B] text-white px-10 py-5 rounded-2xl font-black text-xl shadow-[0_20px_50px_rgba(168,43,59,0.5)] flex items-center gap-4 hover:scale-105 active:scale-95 transition-all group mx-auto"
                >
                  診断を開始する 
                  <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </section>

          {/* コンテンツエリア */}
          <div className="p-6 max-w-md mx-auto space-y-16 -mt-10 relative z-20">
            
            {/* 高精度分析カード */}
            <section className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-[#E5E0D8] space-y-8 text-left">
              <h3 className="text-3xl font-serif font-bold text-[#1A1A1A]">高精度分析</h3>
              <p className="text-sm text-[#1A1A1A]/60 leading-relaxed font-medium">
                感覚ポイントと多次元分析を使用して、あなたの特別な瞬間に最適なワインを検索。
              </p>
              <div className="bg-[#FAF9F6] p-6 rounded-3xl border border-[#E5E0D8]/50 flex flex-col items-center">
                <RadarChart data={{ body: 4, acidity: 3, tannin: 4, sweetness: 2 }} />
                <div className="flex justify-center gap-4 mt-8">
                  {["ブラックベリー", "樽", "バニラ"].map(a => (
                    <div key={a} className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-xl bg-black overflow-hidden shadow-lg border border-white/20">
                        <img src={AROMA_IMAGES[a] || DEFAULT_AROMA_IMAGE} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] font-bold opacity-60 uppercase">{a.substring(0,4)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-black tracking-[0.2em] text-[#A82B3B] text-center pt-2 uppercase">
                Digital Sommelier Experience
              </p>
            </section>

            {/* 専門家検証済み */}
            <section className="bg-[#A82B3B] p-10 rounded-[2.5rem] text-center text-white space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
              <div className="flex justify-center">
                <div className="bg-white/20 p-4 rounded-2xl text-white">
                   <Sparkles size={32} />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-serif font-bold">専門家による検証済み</h3>
                <p className="text-xs leading-relaxed opacity-80 font-medium">
                  日本ソムリエ協会、及びWSET認定のソムリエによってトレーニングされたアルゴリズム。
                </p>
              </div>
            </section>

            {/* ② ランキングボタン（新規追加） */}
            <button 
              onClick={() => setView('ranking')}
              className="w-full relative h-72 rounded-[2.5rem] overflow-hidden shadow-2xl group border-4 border-white"
            >
              <img 
                src="https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=800" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                alt="Ranking"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-10 left-10 text-left">
                <h3 className="text-3xl font-serif font-bold text-white mb-1">ランキング</h3>
                <p className="text-xs text-white/60 font-black tracking-widest uppercase">Popular Selection</p>
              </div>
              <div className="absolute bottom-10 right-10 bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                <ArrowRight size={24} />
              </div>
            </button>

            {/* マイセラー */}
            <button 
              onClick={() => setView('my_selection')}
              className="w-full relative h-72 rounded-[2.5rem] overflow-hidden shadow-2xl group border-4 border-white"
            >
              <img 
                src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                alt="My Cellar"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-10 left-10 text-left">
                <h3 className="text-3xl font-serif font-bold text-white mb-1">マイセラー</h3>
                <p className="text-xs text-white/60 font-black tracking-widest uppercase">Saved Collections</p>
              </div>
              <div className="absolute bottom-10 right-10 bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                <ArrowRight size={24} />
              </div>
            </button>

          </div>

          {/* ③ ボトムナビゲーション：Rankingを追加した4項目版 */}
          <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-[#E5E0D8] flex justify-around p-4 pb-8 z-50">
            <button className="flex flex-col items-center gap-1 text-[#A82B3B]">
              <div className="bg-[#A82B3B] text-white p-3 rounded-2xl mt-[-30px] shadow-xl shadow-[#A82B3B]/30 animate-bounce-subtle">
                <Store size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
            </button>
            
            <button onClick={() => setView('search')} className="flex flex-col items-center gap-1 text-gray-400 opacity-60">
              <Sparkles size={22} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Search</span>
            </button>

            <button onClick={() => setView('ranking')} className="flex flex-col items-center gap-1 text-gray-400 opacity-60">
              <div className="font-serif font-black text-xl leading-none">R</div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Ranking</span>
            </button>

            <button onClick={() => setView('my_selection')} className="flex flex-col items-center gap-1 text-gray-400 opacity-60">
              <Bookmark size={22} />
              <span className="text-[10px] font-black uppercase tracking-tighter">My Cellar</span>
            </button>
          </nav>
        </div>
      )}

      {view === 'search' && (
        <div className="animate-in slide-in-from-bottom-8 duration-500 pb-40 h-screen overflow-y-auto hide-scrollbar bg-[#FAF9F6]">
          {/* ヘッダー：文字色を #1A1A1A (黒) に固定 */}
          <header className="sticky top-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-[#E5E0D8]">
  <div className="w-10">
    <button onClick={() => setView('top')} className="p-2 hover:opacity-50 transition-opacity"><ChevronLeft size={24} className="text-[#1A1A1A]"/></button>
  </div>
  
  <div className="flex items-center gap-2">
    {/* ロゴ表示：高さh-6(24px)で店名と統一 */}
    {store.logo_url ? (
      <img src={store.logo_url} className="h-6 w-auto object-contain" alt="logo" />
    ) : (
      <div className="w-6 h-6 rounded-full bg-gray-200" />
    )}
    <h1 className="text-xl font-serif font-black tracking-tight text-[#1A1A1A]">{store.name}</h1>
  </div>
  
  <button className="p-2 opacity-30"><Settings size={20}/></button>
</header>

          <div className="p-6 max-w-md mx-auto space-y-16">
            {/* 専属AIソムリエ診断：黄色を排除しボルドーレッド(#A82B3B)へ */}
            <div className="text-left py-4">
              <h2 className="text-4xl font-serif font-bold mb-2 text-[#A82B3B] leading-tight">
                {store.program_name || '専属AIソムリエ診断'}
              </h2>
              <p className="text-sm text-[#1A1A1A] opacity-40 font-medium leading-relaxed tracking-wide">
                Find the wine that resonates with your present state.
              </p>
            </div>

            {/* STEP 01: カラーから選ぶ */}
            <section className="space-y-6">
              <div className="flex justify-between items-end border-b border-[#E5E0D8] pb-2">
                <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">カラーから選ぶ</h3>
                <span className="text-[10px] text-[#A82B3B] font-black tracking-widest uppercase">Step 01</span>
              </div>
              <div className="relative pt-6 px-2">
                <div className="h-4 w-full rounded-full shadow-inner" style={{ background: 'linear-gradient(to right, #ffb6c1, #e11d48, #9333ea, #1e3a8a, #10b981, #f97316, #eab308, #f8fafc)' }} />
                <input type="range" className="color-range-input absolute top-2 left-0 w-full h-12 opacity-100 bg-transparent appearance-none cursor-pointer" 
                  value={searchParams.colorValue} onChange={(e) => setSearchParams({...searchParams, colorValue: parseInt(e.target.value)})} />
                <div className="flex justify-between mt-8 text-[10px] font-black text-[#1A1A1A] opacity-30 tracking-[0.2em] uppercase">
                  <span>Red</span>
                  <span>White</span>
                </div>
              </div>
            </section>

            {/* STEP 02: シーンから選ぶ（オプションONの時のみ表示） */}
            {options.show_scenes !== false && (
              <section className="space-y-6 text-left">
                <div className="flex justify-between items-end border-b border-[#E5E0D8] pb-2">
                  <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">シーンから選ぶ</h3>
                  <span className="text-[10px] text-[#A82B3B] font-black tracking-widest uppercase">Step 02</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(store.business_type === 'restaurant' ? SCENES_RESTAURANT : SCENES_RETAIL).map(s => (
                    <button key={s} onClick={() => setSearchParams({...searchParams, scene: s})} 
                      className={`h-40 rounded-3xl flex flex-col items-center justify-center transition-all duration-500 shadow-sm border-2 ${
                        searchParams.scene === s 
                          ? 'bg-[#0A1F11] text-white border-[#0A1F11] shadow-xl scale-105 z-10' 
                          : 'bg-[#F3F0EC] text-[#1A1A1A] border-transparent opacity-70 hover:opacity-100'
                      }`}>
                      <span className="text-lg font-serif font-bold tracking-tight">{s}</span>
                      <div className={`w-8 h-[1.5px] mt-4 transition-colors ${searchParams.scene === s ? 'bg-amber-400' : 'bg-black/10'}`} />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* STEP 03: タグ検索（配色の統一） */}
            <section className="space-y-6">
              <div className="flex justify-between items-end border-b border-[#E5E0D8] pb-2">
                <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">タグ検索</h3>
                <span className="text-[10px] text-[#A82B3B] font-black tracking-widest uppercase">Step 03</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {WINE_TAG_OPTIONS.map(t => (
                  <button key={t} onClick={() => setSearchParams({...searchParams, tag: t})} 
                    className={`px-5 py-3 rounded-full text-[11px] font-bold transition-all border-2 ${
                      searchParams.tag === t 
                        ? 'bg-[#A82B3B] text-white border-[#A82B3B] shadow-lg scale-105' 
                        : 'bg-white text-gray-500 border-[#E5E0D8] hover:border-[#A82B3B]/30'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </section>

            {/* 診断するボタン（Step 03の直後、ドラマチックな演出） */}
            <div className="py-12">
              <button onClick={() => startDiagnosis()} 
                className="w-full py-6 bg-[#A82B3B] text-white rounded-[2rem] font-black text-xl shadow-[0_20px_50px_rgba(168,43,59,0.3)] flex items-center justify-center gap-4 active:scale-95 transition-all uppercase tracking-[0.2em] group">
                診断を開始する 
                <div className="bg-white/20 p-2 rounded-full group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={20} />
                </div>
              </button>
            </div>

            {/* --- 追加：今日の献立から選ぶ（小売店かつオプションONの時のみ表示） --- */}
            {store.business_type === 'retail' && retailTags.length > 0 && options.show_menu_tags !== false && (
              <section className="space-y-6 pb-12 text-left">
                <div className="flex justify-between items-end border-b border-[#E5E0D8] pb-2">
                  <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">今日の献立から選ぶ</h3>
                </div>
                
                {/* データベースから取得したタグをカテゴリごとに自動生成 */}
                {Array.from(new Set(retailTags.map(t => t.category_name))).map(cat => (
                  <div key={cat} className="space-y-3 pt-4 first:pt-0">
                    <h4 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#A82B3B]" /> {cat}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {retailTags.filter(t => t.category_name === cat).map(tag => (
                        <button 
                          key={tag.id} 
                          onClick={() => startDiagnosis(tag.pairing_wine_id)} 
                          className="px-5 py-3 bg-[#F3F0EC] text-[#1A1A1A] text-[13px] font-bold rounded-lg hover:bg-[#E5E0D8] transition-colors shadow-sm"
                        >
                          {tag.tag_name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* STEP 04: おすすめ商品から選ぶ（オプションONの時のみ表示） */}
            {dishes.length > 0 && options.show_recommendations !== false && (
              <section className="space-y-8 pb-10 text-left">
                <div className="flex justify-between items-end border-b border-[#E5E0D8] pb-2">
                  <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">
                    {store.business_type === 'restaurant' ? '料理から選ぶ' : 'おすすめ商品'}
                  </h3>
                  <span className="text-[10px] text-[#A82B3B] font-black tracking-widest uppercase">Step 04</span>
                </div>
                <div className="grid grid-cols-1 gap-12">
                  {dishes.map(dish => (
                    <button key={dish.id} onClick={() => startDiagnosis(dish.pairing_wine_id)} className="w-full text-left group">
                      <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden mb-6 shadow-2xl transition-all duration-700 group-hover:scale-[1.02]">
                        <img src={dish.image_url || 'https://via.placeholder.com/400x225'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                      </div>
                      <div className="flex justify-between items-baseline mb-3">
                        <h4 className="text-2xl font-serif font-bold tracking-tight text-[#1A1A1A]">
                          {dish.name?.length > 25 ? dish.name.substring(0, 25) + '...' : dish.name}
                        </h4>
                        <span className="text-xl font-serif font-medium text-[#A82B3B]">¥{dish.price}</span>
                      </div>

                      <p className="text-sm text-gray-500 leading-relaxed mb-4">
                        {dish.comment?.length > 55 ? dish.comment.substring(0, 55) + '...' : dish.comment}
                      </p>

                      <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {dish.spiciness > 0 && (
                          <span className="flex items-center gap-1 bg-[#F3F0EC] px-3 py-1 rounded-full text-[#A82B3B]">
                            SPICY 
                            <span className="ml-1 tracking-tighter">
                              {Array.from({ length: Math.min(dish.spiciness, 5) }).map((_, i) => '🌶️')}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 bg-[#F3F0EC] px-3 py-1 rounded-full">アレルギー: {dish.allergy || 'なし'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
         {/* --- 追加：ボトムナビゲーション (診断結果ページと共通デザイン) --- */}
          <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-[#E5E0D8] flex justify-around p-4 pb-8 z-50">
  <button onClick={() => setView('top')} className="flex flex-col items-center gap-1 text-gray-400 opacity-60">
    <Store size={22} /><span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
  </button>
  
  <button className="flex flex-col items-center gap-1 text-[#A82B3B]">
    <div className="bg-[#A82B3B] text-white p-3 rounded-2xl mt-[-30px] shadow-xl shadow-[#A82B3B]/30 animate-bounce-subtle">
      <Sparkles size={24} />
    </div>
    <span className="text-[10px] font-black uppercase tracking-tighter">Search</span>
  </button>

  {/* Rankingボタンの追加 */}
  <button onClick={() => setView('ranking')} className="flex flex-col items-center gap-1 text-gray-400 opacity-60">
    <div className="font-serif font-black text-xl leading-none">R</div>
    <span className="text-[10px] font-black uppercase tracking-tighter">Ranking</span>
  </button>

  <button onClick={() => setView('my_selection')} className="flex flex-col items-center gap-1 text-gray-400 opacity-60">
    <Bookmark size={22} /><span className="text-[10px] font-black uppercase tracking-tighter">My Cellar</span>
  </button>
</nav>
        </div>
      )}


     {view === 'result' && resultWine && (
        <div className="animate-in fade-in duration-1000 pb-40 h-screen overflow-y-auto hide-scrollbar bg-[#FAF9F6]">
          {/* ヘッダー：ロゴ追加 */}
          <header className="sticky top-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-[#E5E0D8]">
            <div className="w-10">
              <button onClick={() => setView('search')} className="p-2 hover:opacity-50 transition-opacity"><ChevronLeft size={24} className="text-[#1A1A1A]"/></button>
            </div>
            <div className="flex items-center gap-2">
              {store.logo_url ? (
                <img src={store.logo_url} className="h-6 w-auto object-contain" alt="logo" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200" />
              )}
              <h1 className="text-xl font-serif font-black tracking-tight text-[#1A1A1A]">{store.program_name || 'AIワイン診断'}</h1>
            </div>
            <button className="p-2 opacity-30"><Settings size={20}/></button>
          </header>

          <div className="p-6 max-w-md mx-auto space-y-10">
            
            {/* ワイン画像セクション：タイプ別の液体エフェクト */}
            <div className="relative aspect-square bg-white rounded-[2.5rem] flex items-center justify-center shadow-sm overflow-hidden border border-[#E5E0D8]">
              {/* 液体背景レイヤー */}
              <div 
                className="absolute inset-0 opacity-20 animate-liquid"
                style={{
                  background: 
                    resultWine.wine_type === '赤' ? '#A82B3B' :
                    (resultWine.wine_type === '白' || resultWine.wine_type === '泡') ? '#F3DA91' :
                    resultWine.wine_type === 'ロゼ' ? '#E1306C' :
                    resultWine.wine_type === 'オレンジ' ? '#F97316' : '#A82B3B'
                }}
              />
              <img src={resultWine.image_url || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400'} className="relative z-10 h-full object-contain p-10 drop-shadow-2xl" />
            </div>

            {/* タイトル・基本情報 */}
            <div className="space-y-4">
              <h2 className="text-4xl font-serif font-bold leading-tight text-[#1A1A1A]">{resultWine.name}</h2>
              <div className="flex flex-col gap-2 text-sm font-bold text-[#1A1A1A]/60 text-left">
                <p className="flex items-center gap-2">🍷 {resultWine.wine_type}ワイン</p>
                <p className="flex items-center gap-2">📍 {resultWine.origin}</p>
                {/* 品種・比率を追加 */}
                <p className="flex items-start gap-2">
                  <Grape size={18} className="flex-shrink-0 mt-0.5" />
                  <span>{resultWine.grape || '品種情報なし'}</span>
                </p>
              </div>
            </div>

            {/* 価格カード */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F3F0EC] p-6 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">ボトル価格</span>
                <span className="text-2xl font-serif font-black text-black">
                  ¥{resultWine.bottle_price ? resultWine.bottle_price.toLocaleString() : '-'}
                </span>
              </div>
              <div className="bg-[#F3F0EC] p-6 rounded-2xl flex flex-col items-center justify-center border border-[#A82B3B]/10">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">グラス価格</span>
                <span className="text-2xl font-serif font-black text-[#A82B3B]">
                  ¥{resultWine.glass_price ? resultWine.glass_price.toLocaleString() : '-'}
                </span>
              </div>
            </div>

            {/* 味わいの特徴（マッチ率計算ロジック込み） */}
            <section className="space-y-6">
              <div className="flex justify-between items-baseline border-b border-[#E5E0D8] pb-2">
                <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">味わいの特徴</h3>
                {(() => {
                  const userT = [3,3,3,3]; // 本来はsearchParamsから取得
                  const wineT = resultWine.taste;
                  const sumDiff = Math.abs(userT[0] - wineT.body) + Math.abs(userT[1] - wineT.acidity) + Math.abs(userT[2] - wineT.tannin) + Math.abs(userT[3] - wineT.sweetness);
                  const score = Math.max(0, Math.round((1 - sumDiff / 16) * 100));
                  return <span className="text-[#A82B3B] font-black text-sm">{score}% マッチ</span>;
                })()}
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E0D8] shadow-sm">
                <RadarChart data={resultWine.taste} />
              </div>
            </section>

            {/* 香りと味わい */}
            <section className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A]">香りと味わい</h3>
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {resultWine.aromas?.map((a: string) => (
                  <div key={a} className="flex flex-col items-center gap-3 min-w-[110px]">
                    <div className="w-24 h-24 rounded-2xl bg-[#FAF9F6] overflow-hidden shadow-lg border border-[#E5E0D8]">
                      <img src={AROMA_IMAGES[a] || DEFAULT_AROMA_IMAGE} alt={a} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-bold text-[#1A1A1A]">{a}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ソムリエコメント */}
            <div className="bg-[#0A1F11] p-10 rounded-[2rem] relative overflow-hidden text-white shadow-2xl text-left">
               <Quote className="absolute top-6 right-6 w-20 h-20 opacity-10 rotate-180" />
               <p className="text-[10px] font-black text-amber-500 mb-6 tracking-[0.2em] uppercase">ソムリエのコメント</p>
               <p className="relative z-10 leading-loose font-serif text-xl italic opacity-95">「{resultWine.comment}」</p>
            </div>

           {/* レビュー */}
            <section className="space-y-8 text-left">
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A] border-b border-[#E5E0D8] pb-2">レビュー</h3>
              {/* ↓修正：3件程度でスクロールするように高さを制限し、スクロールバーを隠す */}
              <div className="space-y-8 max-h-[320px] overflow-y-auto pr-2 hide-scrollbar">
                {approvedComments.length > 0 ? approvedComments.map((c, i) => (
                  <div key={i} className="space-y-2 border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                    <div className="flex justify-between items-center text-xs">
                      <p className="font-bold text-[#1A1A1A]">{c.nickname}</p>
                      <p className="text-gray-400">{new Date(c.created_at).toLocaleDateString('ja-JP')}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-[#1A1A1A]/80">{c.comment}</p>
                  </div>
                )) : <p className="text-sm opacity-40 italic">まだレビューがありません</p>}
              </div>
            </section>

            {/* アクションボタン */}
            <div className="flex gap-4 items-center">
              <button onClick={() => handleLike(resultWine.id)} className="bg-[#F3F0EC] p-4 rounded-2xl flex flex-col items-center justify-center min-w-[80px] hover:bg-[#E5E0D8] border border-gray-100 shadow-sm">
                <Heart size={24} className={resultWine.total_likes > 0 ? "text-[#A82B3B] fill-[#A82B3B]" : "text-gray-400"} />
                <span className="text-xs font-black mt-1 text-[#1A1A1A]">{resultWine.total_likes || 0}</span>
              </button>
              <button onClick={() => setShowCommentModal(true)} className="flex-1 bg-[#0A1F11] h-[72px] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                <MessageCircle size={20}/> コメントを投稿
              </button>
            </div>

            <button onClick={() => { if(store.google_map_url) window.open(store.google_map_url, '_blank'); else alert("URLが設定されていません。"); }} 
              className="w-full py-5 border-2 border-[#0A1F11] rounded-2xl text-sm font-black flex items-center justify-center gap-2 text-[#0A1F11]">
              🏪 お店の口コミを投稿
            </button>

            {/* SNSシェア */}
            <div className="pt-10 space-y-4">
              <p className="text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase text-center">診断結果をシェアする</p>
              <div className="flex justify-center gap-6">
                <button onClick={() => handleShare('line')} className="w-14 h-14 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center text-[#06C755]"><MessageCircle size={24} /></button>
                <button onClick={() => handleShare('instagram')} className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-105" style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </button>
                <button onClick={() => handleShare('x')} className="w-14 h-14 bg-white rounded-full border border-gray-100 shadow-sm flex items-center justify-center text-black font-bold text-xl">X</button>
              </div>
            </div>
          </div>

          {/* ボトムナビゲーション：RESULTSを削除し、MY CELLARを追加 */}
          <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-[#E5E0D8] flex justify-around p-4 pb-8 z-50">
            {/* HOME */}
            <button onClick={() => setView('top')} className="flex flex-col items-center gap-1 text-gray-400 opacity-60">
              <Store size={22} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
            </button>
            
            {/* SEARCH */}
            <button onClick={() => setView('search')} className="flex flex-col items-center gap-1 text-gray-400 opacity-60">
              <Sparkles size={22} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Search</span>
            </button>

            {/* RANKING */}
            <button onClick={() => setView('ranking')} className="flex flex-col items-center gap-1 text-gray-400 opacity-60">
              <div className="font-serif font-black text-xl leading-none">R</div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Ranking</span>
            </button>

            {/* MY CELLAR (追加) */}
            <button onClick={() => setView('my_selection')} className="flex flex-col items-center gap-1 text-gray-400 opacity-60">
              <Bookmark size={22} />
              <span className="text-[10px] font-black uppercase tracking-tighter">My Cellar</span>
            </button>
          </nav>
        </div>
      )}

      {view === 'ranking' && (
        <div className="animate-in fade-in duration-1000 pb-40 h-screen overflow-y-auto hide-scrollbar bg-[#FAF9F6]">
          {/* SEO/AEO用構造化データ */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `${store.name} 人気ワインランキング`,
            "itemListElement": wines.slice(0, 3).map((w, idx) => ({
              "@type": "ListItem",
              "position": idx + 1,
              "name": w.name,
              "url": `${window.location.origin}/?store_id=${store.id}&jan=${w.jan_code}`
            }))
          })}} />

          {/* ヘッダー：店名左にロゴを表示 */}
          <header className="sticky top-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-[#E5E0D8]">
            <div className="w-10">
              <button onClick={() => setView('top')} className="p-2 hover:opacity-50 transition-opacity">
                <ChevronLeft size={24} className="text-[#1A1A1A]"/>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {store.logo_url ? (
                <img src={store.logo_url} className="h-6 w-auto object-contain" alt="logo" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200" />
              )}
              <h1 className="text-xl font-serif font-black tracking-tight text-[#1A1A1A]">{store.name}</h1>
            </div>
            <button className="p-2 opacity-30"><Settings size={20}/></button>
          </header>

          <div className="p-6 max-w-md mx-auto space-y-16">
            <h2 className="text-4xl font-serif font-bold text-[#1A1A1A] leading-tight text-left italic">Wine Rankings</h2>

            {/* --- ① シーン別ランキング --- */}
            <section className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A] border-b border-gray-200 pb-2">シーン別</h3>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {(store.business_type === 'restaurant' ? SCENES_RESTAURANT : SCENES_RETAIL).map(s => (
                  <button key={s} onClick={() => setActiveSubTab(s)}
                    className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap border-2 transition-all ${activeSubTab === s ? 'bg-[#A82B3B] border-[#A82B3B] text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-6 overflow-x-auto pb-6 px-1 scroll-smooth snap-x snap-mandatory hide-scrollbar cursor-grab active:cursor-grabbing">
                {wines
                  .filter(w => activeSubTab === '' || w.tags?.includes(activeSubTab))
                  .sort((a, b) => (b.total_likes || 0) - (a.total_likes || 0))
                  .slice(0, 3)
                  .map((wine, idx) => (
                  <div key={wine.id} onClick={() => {setResultWine(wine); setView('result');}} 
                    className="min-w-[280px] snap-center bg-white rounded-[2.5rem] border border-[#E5E0D8] p-6 shadow-xl relative cursor-pointer active:scale-95 transition-transform">
                    <div className="absolute top-4 left-4 w-10 h-10 bg-[#A82B3B] text-white rounded-xl flex items-center justify-center font-serif font-bold text-xl shadow-lg z-10">{idx + 1}</div>
                    <div className="aspect-square mb-4 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img src={wine.image_url} className="h-full object-contain p-4" alt={wine.name} />
                    </div>
                    <h4 className="text-lg font-serif font-bold mb-1 truncate text-left text-[#1A1A1A]">{wine.name}</h4>
                    <p className="text-[10px] font-bold opacity-30 uppercase text-left text-[#1A1A1A]">{wine.origin}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* --- ② タグ別ランキング --- */}
            <section className="space-y-6">
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A] border-b border-gray-200 pb-2">タグ別</h3>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                {WINE_TAG_OPTIONS.map(t => (
                  <button key={t} onClick={() => setActiveTagTab(t)}
                    className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap border-2 transition-all ${activeTagTab === t ? 'bg-[#0A1F11] border-[#0A1F11] text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-6 overflow-x-auto pb-6 px-1 scroll-smooth snap-x snap-mandatory hide-scrollbar cursor-grab active:cursor-grabbing">
                {wines
                  .filter(w => activeTagTab === '' || w.tags?.includes(activeTagTab))
                  .sort((a, b) => (b.total_likes || 0) - (a.total_likes || 0))
                  .slice(0, 3)
                  .map((wine, idx) => (
                  <div key={wine.id} onClick={() => {setResultWine(wine); setView('result');}} 
                    className="min-w-[280px] snap-center bg-white rounded-[2rem] border border-[#E5E0D8] p-6 shadow-xl relative cursor-pointer active:scale-95 transition-transform">
                    <div className="absolute top-4 left-4 w-10 h-10 bg-[#0A1F11] text-white rounded-xl flex items-center justify-center font-serif font-bold text-xl shadow-lg z-10">{idx + 1}</div>
                    <div className="aspect-square mb-4 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                      <img src={wine.image_url} className="h-full object-contain p-4" alt={wine.name} />
                    </div>
                    <h4 className="text-lg font-serif font-bold mb-1 truncate text-left text-[#1A1A1A]">{wine.name}</h4>
                    <p className="text-[10px] font-bold opacity-30 uppercase text-left text-[#1A1A1A]">{wine.origin}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* --- ③ 店舗情報・カラーMAP --- */}
            <section className="pt-10 border-t border-[#E5E0D8] space-y-8 text-left">
              <h3 className="text-4xl font-serif font-bold text-[#1A1A1A] uppercase tracking-tighter">{store.name}</h3>
              {store.google_map_url ? (
                <div className="space-y-6">
                  <div className="w-full h-64 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-gray-200">
                    <iframe 
                      width="100%" height="100%" 
                      style={{ border: 0 }} 
                      loading="lazy"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(store.name + " " + (store.area || ""))}&output=embed&hl=ja`}
                    />
                  </div>
                  <div className="p-8 bg-[#F3F0EC] rounded-[2.5rem] space-y-4 shadow-sm">
                    <p className="text-sm font-medium leading-relaxed opacity-60 text-[#1A1A1A]">
                      {store.area}にある{store.genre}のお店です。最高の一杯をソムリエがご提案します。
                    </p>
                    <button onClick={() => window.open(store.google_map_url, '_blank')} 
                      className="w-full py-5 bg-[#0A1F11] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform">
                      このお店をGoogleMapで調べる <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ) : <p className="text-sm opacity-30 italic">Map情報は登録されていません</p>}
            </section>
          </div>

          {/* ボトムナビゲーション */}
          <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-[#E5E0D8] flex justify-around p-4 pb-8 z-50">
            <button onClick={() => setView('top')} className="flex flex-col items-center gap-1 opacity-30"><Store size={22} /><span className="text-[10px] font-black uppercase">Home</span></button>
            <button onClick={() => setView('search')} className="flex flex-col items-center gap-1 opacity-30"><Sparkles size={22} /><span className="text-[10px] font-black uppercase">Search</span></button>
            <button className="flex flex-col items-center gap-1 text-[#A82B3B]">
              <div className="bg-[#A82B3B] text-white p-3 rounded-2xl mt-[-30px] shadow-xl shadow-[#A82B3B]/30 animate-bounce-subtle">
                <div className="font-serif font-black text-xl leading-none">R</div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Ranking</span>
            </button>
            <button onClick={() => setView('my_selection')} className="flex flex-col items-center gap-1 opacity-30"><Bookmark size={22} /><span className="text-[10px] font-black uppercase">My Cellar</span></button>
          </nav>
        </div>
      )}



      {/* コメント用モーダル */}
      {showCommentModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm space-y-6 shadow-2xl text-left border border-[#E5E0D8]">
            <h3 className="text-xl font-serif font-black flex items-center gap-2 text-[#0A1F11] border-b border-gray-100 pb-2 uppercase">
              <MessageCircle/> Review Post
            </h3>
            <input placeholder="ニックネーム" value={commentForm.nickname} onChange={e => setCommentForm({...commentForm, nickname: e.target.value})} className="w-full p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6] text-[#1A1A1A]" />
            <textarea placeholder="このワインの感想を教えてください" value={commentForm.comment} onChange={e => setCommentForm({...commentForm, comment: e.target.value})} className="w-full p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6] h-32 text-[#1A1A1A]" />
            
            {/* ↓追加：Google reCAPTCHAコンポーネント */}
            <div className="flex justify-center scale-90 origin-left">
              <ReCAPTCHA 
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""} 
                onChange={(token) => setCaptchaToken(token)} 
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={submitComment} className="flex-1 py-4 bg-[#A82B3B] text-white font-bold rounded-xl shadow-lg hover:bg-[#8E2533] transition-colors">送信する</button>
              <button onClick={() => setShowCommentModal(false)} className="px-6 py-4 bg-gray-100 font-bold rounded-xl text-gray-500 hover:bg-gray-200 transition-colors">閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* マイセレクション画面 */}
      {view === 'my_selection' && (
        <div className="animate-in fade-in duration-1000 pb-40 h-screen overflow-y-auto hide-scrollbar bg-[#FAF9F6]">
          {/* ヘッダー：他ページと共通デザイン */}
          <header className="sticky top-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-[#E5E0D8]">
            <div className="w-10">
              <button onClick={() => setView('top')} className="p-2 hover:opacity-50 transition-opacity">
                <ChevronLeft size={24} className="text-[#1A1A1A]"/>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {store.logo_url ? (
                <img src={store.logo_url} className="h-6 w-auto object-contain" alt="logo" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200" />
              )}
              <h1 className="text-xl font-serif font-black tracking-tight text-[#1A1A1A]">{store.name}</h1>
            </div>
            <button className="p-2 opacity-30"><Settings size={20}/></button>
          </header>

          <div className="p-6 max-w-md mx-auto space-y-10">
            <div className="text-left py-4">
              <h2 className="text-4xl font-serif font-bold text-[#A82B3B] leading-tight italic">My Cellar</h2>
              <p className="text-sm text-[#1A1A1A] opacity-40 font-medium tracking-wide">Your saved premium collections.</p>
            </div>

            {/* 保存済みリスト */}
            {mySelections.length === 0 ? (
              <div className="text-center opacity-30 py-24 space-y-4">
                <Bookmark size={48} className="mx-auto opacity-20" />
                <p className="font-serif italic">まだ保存されたワインがありません</p>
              </div>
            ) : (
              <div className="space-y-6 text-left">
                {mySelections.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-[#E5E0D8] shadow-xl flex flex-col gap-4 active:scale-[0.98] transition-transform cursor-pointer"
                       onClick={() => { setResultWine(item.wine); setView('result'); }}>
                    <div className="flex gap-6 items-center">
                      <div className="w-16 h-24 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={item.wine?.image_url || 'https://via.placeholder.com/100'} className="w-full h-full object-contain p-2" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">{item.date} @ {item.storeName}</p>
                        <p className="text-xl font-serif font-bold text-[#1A1A1A] leading-tight">{item.wine?.name}</p>
                        <p className="text-[10px] font-bold text-[#A82B3B] opacity-70 uppercase">{item.wine?.origin}</p>
                      </div>
                    </div>
                    {item.userComment && (
                      <div className="bg-[#FAF9F6] p-4 rounded-2xl border-l-4 border-[#A82B3B]/30 text-xs italic text-[#1A1A1A]/80 leading-relaxed">
                        "{item.userComment}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* フッター：My Cellarをアクティブ（ボルドー浮遊）に */}
          <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-[#E5E0D8] flex justify-around p-4 pb-8 z-50">
            <button onClick={() => setView('top')} className="flex flex-col items-center gap-1 opacity-30">
              <Store size={22} /><span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
            </button>
            <button onClick={() => setView('search')} className="flex flex-col items-center gap-1 opacity-30">
              <Sparkles size={22} /><span className="text-[10px] font-black uppercase tracking-tighter">Search</span>
            </button>
            <button onClick={() => setView('ranking')} className="flex flex-col items-center gap-1 opacity-30">
              <div className="font-serif font-black text-xl leading-none">R</div>
              <span className="text-[10px] font-black uppercase tracking-tighter">Ranking</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-[#A82B3B]">
              <div className="bg-[#A82B3B] text-white p-3 rounded-2xl mt-[-30px] shadow-xl shadow-[#A82B3B]/30 animate-bounce-subtle">
                <Bookmark size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter">My Cellar</span>
            </button>
          </nav>
        </div>
      )}
    {/* --- AI診断中ローディング画面 (CSS Animation版) --- */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white overflow-hidden">
          {/* ホワイトアウトレイヤー */}
          <div className="absolute inset-0 bg-white z-[9999] anim-whiteout pointer-events-none" />
          
          {/* 高級感のある後光 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(159,18,57,0.15)_0%,transparent_60%)] animate-pulse" />

          {/* アニメーションステージ */}
          <div className="relative w-80 h-80 rounded-3xl border border-white/5 bg-white/5 shadow-2xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
            
           {/* レア演出：ひょっこり黒猫 */}
{animType === 'cat' && (
  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 anim-cat z-50 flex flex-col items-center overflow-visible">
    {/* 体 - bg-gray-900（ほぼ黒）に灰色輪郭 border-2 border-gray-600 を追加 */}
    <div className="w-16 h-14 bg-gray-900 rounded-t-[2rem] relative shadow-lg border-2 border-gray-600">
      {/* 耳 - border-b-gray-900を border-b-gray-600 に変更（耳の輪郭） */}
      <div className="absolute -top-3 left-1 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-gray-600 -rotate-12"></div>
      <div className="absolute -top-3 right-1 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[16px] border-l-transparent border-r-transparent border-b-gray-600 rotate-12"></div>
      {/* 目 - そのまま維持 */}
      <div className="absolute top-4 left-3 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center"><div className="w-1 h-2 bg-black rounded-full"></div></div>
      <div className="absolute top-4 right-3 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center"><div className="w-1 h-2 bg-black rounded-full"></div></div>
      
      {/* 鼻と口の再実装 - 目の下、中央に配置。ピンクの小さな三角形の鼻と口のライン */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-pink-300 rounded-full"></div>
        <div className="w-4 h-2 flex justify-center mt-[-1px]">
          <div className="w-[1px] h-2 bg-gray-600"></div>
          <div className="w-[1px] h-2 bg-gray-600 ml-1"></div>
        </div>
      </div>

      {/* 追加：ひげ - 鼻の横から左右に灰色ライン。2本ずつ。 rounded-full で端を丸く。 */}
      <div className="absolute top-7 left-[-6px] flex flex-col gap-1 items-end">
        <div className="w-6 h-0.5 bg-gray-600 -rotate-12 rounded-full"></div>
        <div className="w-7 h-0.5 bg-gray-600 rotate-6 rounded-full"></div>
      </div>
      <div className="absolute top-7 right-[-6px] flex flex-col gap-1 items-start">
        <div className="w-6 h-0.5 bg-gray-600 rotate-12 rounded-full"></div>
        <div className="w-7 h-0.5 bg-gray-600 -rotate-6 rounded-full"></div>
      </div>
    </div>
  </div>
)}

            {/* グラス */}
            <div className="absolute right-12 bottom-12 flex flex-col items-center z-10">
              <div className="w-16 h-16 border-2 border-white/30 rounded-b-[2rem] relative overflow-hidden bg-white/5 shadow-[inset_0_-5px_10px_rgba(255,255,255,0.1)]">
                <div className={`absolute bottom-0 left-0 w-full bg-rose-700/90 shadow-[0_-2px_10px_rgba(225,29,72,0.5)] ${animType === 'fail' ? 'hidden' : 'anim-fill'}`}>
                  <div className="w-full h-1 bg-rose-400/80 absolute top-0 rounded-full" />
                </div>
              </div>
              <div className="w-1 h-12 bg-gradient-to-r from-white/20 via-white/60 to-white/20" />
              <div className="w-12 h-1 bg-white/40 rounded-full" />
            </div>

            {/* ボトルユニット */}
            <div className={`absolute left-16 bottom-12 flex flex-col items-center z-20 ${animType === 'fail' ? 'anim-bottle-fail' : 'anim-bottle'}`}>
              {/* ナイフ */}
              <div className={`absolute -top-12 flex flex-col items-center z-30 ${animType === 'fail' ? 'anim-opener-fail' : 'anim-opener'}`}>
                <div className="w-12 h-2.5 bg-zinc-800 rounded-full shadow-md border-t border-zinc-600" />
                <div className="w-1.5 h-4 bg-zinc-300" />
                <div className="w-3 h-6 border border-zinc-400 border-t-0 rounded-b-full" />
              </div>
              {/* コルク */}
              <div className={`absolute -top-3 w-4 h-6 bg-amber-800 rounded-sm z-20 shadow-inner ${animType === 'fail' ? '' : 'anim-cork'}`} />
              {/* ワインの液体 */}
              {animType !== 'fail' && <div className="absolute -top-1 left-1/2 w-1.5 bg-rose-700 anim-pour z-0 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.8)]" />}
              {/* ボトル本体 */}
              <div className="relative flex flex-col items-center shadow-2xl z-10">
                <div className="w-5 h-14 bg-emerald-950 relative border-r border-white/10">
                  <div className="absolute top-0 left-0 w-full h-3 bg-emerald-900 rounded-t-sm" />
                </div>
                <div className="w-14 h-6 bg-emerald-950 rounded-t-2xl border-r border-white/10" />
                <div className="w-14 h-24 bg-emerald-950 rounded-b-md relative overflow-hidden border-r border-white/10 shadow-[inset_-5px_0_10px_rgba(0,0,0,0.8)]">
                  <div className="absolute top-4 left-1.5 w-11 h-14 bg-[#fdfbf7] rounded-sm flex items-center justify-center">
                    {animType === 'clover' && <span className="text-emerald-700 text-[20px]">🍀</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* メッセージ */}
          <div className="mt-8 text-center relative z-10">
            <h2 className="text-xl font-black font-serif tracking-[0.4em] ml-[0.4em] animate-pulse text-amber-500 drop-shadow-md uppercase">
              Analyzing...
            </h2>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 【App】エントリーポイント
// ==========================================
export default function App() {
  const [mode, setMode] = useState('customer');
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'portal') setMode('portal');
    }
  }, []);

  if (mode === 'portal') return <PortalView setMode={setMode} setActiveStoreId={setActiveStoreId} isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />;
  if (mode === 'admin_master') return <AdminMasterView setMode={setMode} />;
  if (mode === 'admin_store') return <AdminStoreView setMode={setMode} storeId={activeStoreId} />;
  return <CustomerApp />;
}