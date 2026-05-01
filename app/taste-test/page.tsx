'use client';

import { useState, useRef, useMemo } from 'react';
import { ChevronLeft, Grape, Droplets, Flame } from 'lucide-react';

// === アロマの分類リスト（ご指示通り） ===
const FRUITY_AROMAS = ['インク', 'ブラックチェリー', 'ブラックベリー', 'フランボワーズ', 'バナナ', 'パイナップル', '洋ナシ', 'アプリコット', '花梨', 'ライチ', 'メロン', 'マンゴー'];
const SPICY_AROMAS = ['胡椒', 'ピーマン', 'タール', 'ハーブ', '革', '樽', 'タバコ', 'ミント', 'オレンジの皮'];

// === テスト用のワインデータ ===
const DUMMY_WINES = [
  { id: '1', name: 'フレッシュ・ソーヴィニヨン', type: '白', origin: 'NZ', body: 1, acidity: 5, tannin: 1, aromas: ['レモン', '青リンゴ', 'ハーブ'] },
  { id: '2', name: 'リッチ・シャルドネ', type: '白', origin: 'フランス', body: 4, acidity: 3, tannin: 1, aromas: ['バナナ', 'パイナップル', 'バニラ', '樽'] },
  { id: '3', name: 'エレガント・ピノ・ノワール', type: '赤', origin: 'フランス', body: 3, acidity: 4, tannin: 2, aromas: ['フランボワーズ', 'チェリー', 'きのこ'] },
  { id: '4', name: 'フルーティ・メルロー', type: '赤', origin: 'チリ', body: 4, acidity: 3, tannin: 3, aromas: ['ブラックベリー', 'プラム', 'チョコレート'] },
  { id: '5', name: 'スパイシー・シラー', type: '赤', origin: 'オーストラリア', body: 5, acidity: 3, tannin: 4, aromas: ['胡椒', 'ブラックチェリー', '革', 'タバコ'] },
  { id: '6', name: 'ヘビー・カベルネ', type: '赤', origin: 'アメリカ', body: 5, acidity: 2, tannin: 5, aromas: ['カシス', 'ピーマン', '樽', 'タール'] },
];

// === 円形スライダー（Radial Slider）コンポーネント ===
const RadialSlider = ({ value, onChange, labelLeft, labelRight, title, icon: Icon, colorClass }: any) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const handlePointer = (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height * 0.85; // 下部を中心とする
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - cx;
    const dy = cy - y; // SVGは上がマイナスなので反転
    let angle = Math.atan2(dy, dx); 
    
    // 下半分にポインターがある場合の補正（0〜100にクランプ）
    if (angle < 0) {
      if (dx > 0) angle = 0; // 右下にいれば右端
      else angle = Math.PI;  // 左下にいれば左端
    }
    
    // 角度を0-100に変換
    let percent = 100 - (angle / Math.PI) * 100;
    percent = Math.max(0, Math.min(100, Math.round(percent)));
    onChange(percent);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    handlePointer(e);
  };

  // 描画用の計算
  const angle = Math.PI * (1 - value / 100);
  const radius = 80;
  const cx = 100;
  const cy = 105;
  const handleX = cx + radius * Math.cos(angle);
  const handleY = cy - radius * Math.sin(angle);
  const pathData = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${handleX} ${handleY}`;

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-[#E5E0D8] flex flex-col items-center select-none touch-none">
      <div className="flex items-center gap-2 mb-4 text-[#1A1A1A]">
        <Icon size={20} className={colorClass} />
        <h4 className="font-serif font-bold text-lg">{title}</h4>
      </div>
      
      <div className="relative w-full max-w-[240px]">
        <svg 
          ref={svgRef} 
          viewBox="0 0 200 125" 
          className="w-full h-auto cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerMove={(e) => { if (e.buttons > 0) handlePointer(e); }}
        >
          {/* ベースの背景線 */}
          <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke="#F3F0EC" strokeWidth="16" strokeLinecap="round" />
          {/* アクティブな色の線 */}
          {value > 0 && <path d={pathData} fill="none" stroke="currentColor" className={colorClass} strokeWidth="16" strokeLinecap="round" />}
          {/* ドラッグするハンドル */}
          <circle cx={handleX} cy={handleY} r="12" fill="white" stroke="currentColor" className={colorClass} strokeWidth="4" shadow="0 2px 5px rgba(0,0,0,0.2)" />
        </svg>
        
        {/* ラベル */}
        <div className="flex justify-between absolute bottom-1 w-full px-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{labelLeft}</span>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{labelRight}</span>
        </div>
      </div>
      
      <div className={`font-serif font-black text-3xl mt-4 ${colorClass}`}>{value}</div>
    </div>
  );
};

// === メイン画面 ===
export default function TasteTuningUI() {
  const [weight, setWeight] = useState(50);     // 軽い 0 - 100 重い
  const [character, setCharacter] = useState(50); // さっぱり 0 - 100 果実味
  const [texture, setTexture] = useState(50);     // マイルド 0 - 100 スパイシー

  // === ワインのスコアリングロジック（リアルタイム計算） ===
  const matchedWines = useMemo(() => {
    return DUMMY_WINES.map(wine => {
      let score = 100;

      // ① 重厚感 (weight: ボディ)
      const wineWeight = (wine.body - 1) * 25; 
      score -= Math.abs(weight - wineWeight) * 0.4; // 差分を減点

      // ② キャラクター (character: さっぱり vs 果実味)
      if (character < 50) {
        // 酸味を求める（1-5の酸味を100点満点換算して比較）
        const targetAcidity = 5 - (character / 50) * 2;
        score -= Math.abs(targetAcidity - wine.acidity) * 5;
      } else {
        // 果実味(アロマ)を求める
        const fruityCount = wine.aromas.filter(a => FRUITY_AROMAS.includes(a)).length;
        if (fruityCount === 0) score -= 15; // フルーティさが全くないと減点
        else score += Math.min(fruityCount * 5, 15); // フルーティアロマ1つにつき5点加点
      }

      // ③ 質感・余韻 (texture: マイルド vs スパイシー)
      if (texture < 50) {
        // タンニンが低いものを求める
        const targetTannin = 1 + (texture / 50) * 2;
        score -= Math.abs(targetTannin - wine.tannin) * 5;
      } else {
        // スパイシー/ハーバルなアロマを求める
        const spicyCount = wine.aromas.filter(a => SPICY_AROMAS.includes(a)).length;
        if (spicyCount === 0) score -= 15;
        else score += Math.min(spicyCount * 5, 15);
      }

      return { ...wine, score: Math.round(score) };
    }).sort((a, b) => b.score - a.score).slice(0, 3); // 上位3つを取得
  }, [weight, character, texture]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans pb-20">
      <div className="p-4 border-b border-[#E5E0D8] bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <button onClick={() => window.history.back()} className="p-2 -ml-2"><ChevronLeft size={24} /></button>
        <h1 className="font-serif font-black tracking-widest text-sm">味わいチューニング</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-md mx-auto p-6 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-black text-[#A82B3B]">Tasting Dial</h2>
          <p className="text-sm font-bold text-gray-500">直感で、あなたの求める味わいを<br/>チューニングしてください。</p>
        </div>

        {/* スライダー群 */}
        <div className="space-y-6">
          <RadialSlider 
            title="① 重厚感" icon={Droplets} colorClass="text-[#A82B3B]"
            value={weight} onChange={setWeight} 
            labelLeft="Light (軽い)" labelRight="Heavy (重い)" 
          />
          <RadialSlider 
            title="② キャラクター" icon={Grape} colorClass="text-purple-600"
            value={character} onChange={setCharacter} 
            labelLeft="Fresh (さっぱり)" labelRight="Fruity (果実味)" 
          />
          <RadialSlider 
            title="③ 質感・余韻" icon={Flame} colorClass="text-amber-600"
            value={texture} onChange={setTexture} 
            labelLeft="Mild (マイルド)" labelRight="Spicy/Herbal" 
          />
        </div>

        {/* リアルタイム結果表示 */}
        <div className="pt-8 border-t border-[#E5E0D8] space-y-4">
          <h3 className="font-serif font-bold text-lg text-center">この味わいに近いワイン TOP3</h3>
          <div className="space-y-3">
            {matchedWines.map((wine, idx) => (
              <div key={wine.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-[#1A1A1A] text-white rounded-full flex flex-col items-center justify-center font-bold text-xs shrink-0 shadow-md">
                  <span>{idx + 1}</span>
                </div>
                <div className="flex-1 text-left space-y-1">
                  <p className="font-black text-lg leading-tight text-[#1A1A1A]">{wine.name}</p>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-[#A82B3B] bg-rose-50 px-2 py-0.5 rounded">スコア: {wine.score}</span>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">ボディ: {wine.body}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">アロマ: {wine.aromas.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}