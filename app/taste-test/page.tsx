'use client';

import { useState, useRef, useMemo } from 'react';
import { ChevronLeft, Grape, Droplets, Flame } from 'lucide-react';

// === アロマの分類リスト ===
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

// === 洗練されたサイバーダイヤルコンポーネント (UICapsule完全再現 + グラデーション色) ===
const CyberDial = ({ value, onChange, labelLeft, labelRight, title, icon: Icon, startRGB, endRGB }: any) => {
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startVal = useRef(value);

  // 指を置いた時
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    startVal.current = value;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  // 指を動かした時
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX.current;
    // 右にドラッグすると数値が減る（目盛りが右に回る）ように感度調整
    let newVal = startVal.current - (dx / 3); 
    newVal = Math.max(0, Math.min(100, Math.round(newVal)));
    onChange(newVal);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // インデックス(0~100)に応じた美しいグラデーション色を計算
  const calculateColor = (index: number) => {
    if (!startRGB || !endRGB) return 'white';
    const ratio = index / 100;
    const r = Math.round(startRGB[0] + ratio * (endRGB[0] - startRGB[0]));
    const g = Math.round(startRGB[1] + ratio * (endRGB[1] - startRGB[1]));
    const b = Math.round(startRGB[2] + ratio * (endRGB[2] - startRGB[2]));
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="flex items-stretch bg-white p-2.5 rounded-[1.5rem] shadow-sm border border-[#E5E0D8]">
      
      {/* 左側：タイトルとラベル（縦幅を抑えるための横並びレイアウト） */}
      <div className="flex flex-col justify-center w-[115px] pl-2 pr-3 shrink-0 border-r border-[#E5E0D8] border-dashed mr-3">
        <div className="flex items-center gap-1.5 text-[#1A1A1A] mb-2">
          <Icon size={16} className="text-[#A82B3B]" />
          <h4 className="font-serif font-bold text-[13px] tracking-tight leading-tight">{title}</h4>
        </div>
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter leading-none">{labelLeft}</span>
          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter leading-none text-center">▼</span>
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter leading-none">{labelRight}</span>
        </div>
      </div>

      {/* 右側：UICapsule風ダイヤル本体 */}
      <div 
        className="flex-1 relative h-[90px] overflow-hidden rounded-2xl bg-zinc-950 shadow-2xl p-4 touch-none cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* フェードシャドウ（立体感の演出） */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-30 h-[40%] bg-gradient-to-b from-transparent to-black" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-30 w-10 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-30 w-10 bg-gradient-to-l from-black to-transparent" />

        {/* センターの白いインジケーター（針） */}
        <div className="pointer-events-none absolute left-1/2 z-20 h-5 w-[3px] -translate-x-1/2 top-0 rounded-b-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)]" />

        {/* 数値表示 */}
        <div className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 z-30 flex items-baseline">
          <span className="text-white font-mono text-[22px] font-black drop-shadow-md">{value}</span>
        </div>

        {/* 目盛りの円盤（巨大な円を配置し、上部だけを表示） */}
        <div 
          className="absolute left-1/2 top-0 w-[400px] h-[400px]"
          style={{ 
            transform: `translateX(-50%) rotate(${-value * 3.6}deg)`,
            transition: isDragging ? 'none' : 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        >
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${i * 3.6}deg)` }}>
              {/* 10目盛りごとに太い線、グラデーションカラーを適用 */}
              <div 
                className={`absolute top-0 ${i % 10 === 0 ? 'h-5 w-[2px]' : 'h-3 w-[1px]'}`} 
                style={{ backgroundColor: calculateColor(i) }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// === メイン画面 ===
export default function TasteTuningUI() {
  const [weight, setWeight] = useState(50);     
  const [character, setCharacter] = useState(50); 
  const [texture, setTexture] = useState(50);     

  // === ワインのスコアリングロジック（リアルタイム計算） ===
  const matchedWines = useMemo(() => {
    return DUMMY_WINES.map(wine => {
      let score = 100;

      // ① 重厚感 (weight: ボディ)
      const wineWeight = (wine.body - 1) * 25; 
      score -= Math.abs(weight - wineWeight) * 0.4; 

      // ② キャラクター (character: さっぱり vs 果実味)
      if (character < 50) {
        const targetAcidity = 5 - (character / 50) * 2;
        score -= Math.abs(targetAcidity - wine.acidity) * 5;
      } else {
        const fruityCount = wine.aromas.filter(a => FRUITY_AROMAS.includes(a)).length;
        if (fruityCount === 0) score -= 15; 
        else score += Math.min(fruityCount * 5, 15); 
      }

      // ③ 質感・余韻 (texture: マイルド vs スパイシー)
      if (texture < 50) {
        const targetTannin = 1 + (texture / 50) * 2;
        score -= Math.abs(targetTannin - wine.tannin) * 5;
      } else {
        const spicyCount = wine.aromas.filter(a => SPICY_AROMAS.includes(a)).length;
        if (spicyCount === 0) score -= 15;
        else score += Math.min(spicyCount * 5, 15);
      }

      return { ...wine, score: Math.round(score) };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
  }, [weight, character, texture]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-sans pb-20">
      <div className="p-4 border-b border-[#E5E0D8] bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <button onClick={() => window.history.back()} className="p-2 -ml-2"><ChevronLeft size={24} /></button>
        <h1 className="font-serif font-black tracking-widest text-sm">味わいチューニング</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-md mx-auto p-4 space-y-10 mt-4">
        <div className="text-left space-y-2 mb-6">
          <h2 className="text-3xl font-serif font-black text-[#A82B3B]">Tasting Dial</h2>
          <p className="text-xs font-bold text-gray-500 leading-relaxed">ダイヤルを左右にスワイプして、<br/>直感であなたの求める味わいをチューニングしてください。</p>
        </div>

        {/* 洗練されたコンパクトなサイバーダイヤル群 (グラデーション色復活) */}
        <div className="space-y-4">
          <CyberDial 
            title="① 重厚感" icon={Droplets} 
            value={weight} onChange={setWeight} 
            labelLeft="Light (軽い)" labelRight="Heavy (重い)" 
            startRGB={[59, 130, 246]} endRGB={[225, 29, 72]} // 青から赤
          />
          <CyberDial 
            title="② キャラクター" icon={Grape} 
            value={character} onChange={setCharacter} 
            labelLeft="Fresh (さっぱり)" labelRight="Fruity (果実)" 
            startRGB={[16, 185, 129]} endRGB={[147, 51, 234]} // 緑から紫
          />
          <CyberDial 
            title="③ 質感・余韻" icon={Flame} 
            value={texture} onChange={setTexture} 
            labelLeft="Mild (マイルド)" labelRight="Spicy/Herbal" 
            startRGB={[234, 179, 8]} endRGB={[249, 115, 22]} // 黄色からオレンジ
          />
        </div>

        {/* リアルタイム結果表示 */}
        <div className="pt-8 border-t border-[#E5E0D8] space-y-4">
          <h3 className="font-serif font-bold text-lg text-left">この味わいに近いワイン TOP3</h3>
          <div className="space-y-3">
            {matchedWines.map((wine, idx) => (
              <div key={wine.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-[#1A1A1A] text-white rounded-full flex flex-col items-center justify-center font-bold text-xs shrink-0 shadow-md">
                  <span>{idx + 1}</span>
                </div>
                <div className="flex-1 text-left space-y-1">
                  <p className="font-black text-[15px] leading-tight text-[#1A1A1A]">{wine.name}</p>
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