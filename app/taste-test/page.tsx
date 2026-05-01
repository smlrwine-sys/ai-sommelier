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

// === 超高機能サイバーダイヤルコンポーネント（自作で完全再現） ===
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

  // 指を動かした時（横方向のドラッグで数値を滑らかに変動させる）
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startX.current;
    let newVal = startVal.current + (dx / 3); // dxの割り算で感度を調整
    newVal = Math.max(0, Math.min(100, Math.round(newVal)));
    onChange(newVal);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // 1メモリ3.6度で円形に配置し、現在の値に合わせて全体を回転させる
  const currentRotation = -value * 3.6;

  // インデックス(0~100)に応じた美しいグラデーション色を計算
  const calculateColor = (index: number) => {
    const ratio = index / 100;
    const r = Math.round(startRGB[0] + ratio * (endRGB[0] - startRGB[0]));
    const g = Math.round(startRGB[1] + ratio * (endRGB[1] - startRGB[1]));
    const b = Math.round(startRGB[2] + ratio * (endRGB[2] - startRGB[2]));
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="flex flex-col items-center select-none">
      <div className="flex items-center gap-2 mb-3 text-[#1A1A1A]">
        <Icon size={18} />
        <h4 className="font-serif font-bold text-[15px]">{title}</h4>
      </div>
      
      {/* ダイヤル本体（黒ベースで縦幅を抑えたスタイリッシュな形状） */}
      <div 
        className="relative w-full max-w-[320px] h-28 bg-black rounded-3xl overflow-hidden shadow-2xl touch-none cursor-grab active:cursor-grabbing border border-black/10 mx-auto"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* 左右と下部のフェードシャドウ（立体感と奥行きを出す） */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-black to-transparent" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 h-12 bg-gradient-to-t from-black to-transparent" />
        
        {/* 数値表示（NumberFlowの代わり） */}
        <div className="absolute top-3 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <span className="text-white font-mono text-2xl font-bold tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{value}</span>
        </div>

        {/* センターの白いインジケーター（針） */}
        <div className="pointer-events-none absolute left-1/2 top-11 z-30 h-10 w-[2px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]" />

        {/* 目盛りの円盤 */}
        <div 
          className="absolute left-1/2 top-14 w-[280px] h-[280px] rounded-full"
          style={{ 
            transform: `translateX(-50%) rotate(${currentRotation}deg)`, 
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)' 
          }}
        >
          {Array.from({ length: 101 }).map((_, i) => {
            const angle = i * 3.6;
            const isTenth = i % 10 === 0; // 10ごとに太い線にする
            return (
              <div
                key={i}
                className="absolute inset-0 flex justify-center"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <div 
                  className={`rounded-full ${isTenth ? 'h-6 w-[2px]' : 'h-3 w-[1px]'}`} 
                  style={{ backgroundColor: calculateColor(i), opacity: 0.9 }} 
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* ガイドラベル */}
      <div className="flex justify-between w-full max-w-[300px] px-2 mt-3">
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{labelLeft}</span>
        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{labelRight}</span>
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

      <div className="max-w-md mx-auto p-6 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-black text-[#A82B3B]">Tasting Dial</h2>
          <p className="text-xs font-bold text-gray-500 leading-relaxed">スライダーを左右にドラッグして、<br/>直感であなたの求める味わいをチューニングしてください。</p>
        </div>

        {/* 洗練されたサイバーダイヤル群 */}
        <div className="space-y-8">
          <CyberDial 
            title="① 重厚感" icon={Droplets} 
            value={weight} onChange={setWeight} 
            labelLeft="Light (軽い)" labelRight="Heavy (重い)" 
            startRGB={[59, 130, 246]} endRGB={[225, 29, 72]} // 青から赤へのグラデーション
          />
          <CyberDial 
            title="② キャラクター" icon={Grape} 
            value={character} onChange={setCharacter} 
            labelLeft="Fresh (さっぱり)" labelRight="Fruity (果実味)" 
            startRGB={[16, 185, 129]} endRGB={[147, 51, 234]} // 緑から紫へのグラデーション
          />
          <CyberDial 
            title="③ 質感・余韻" icon={Flame} 
            value={texture} onChange={setTexture} 
            labelLeft="Mild (マイルド)" labelRight="Spicy/Herbal" 
            startRGB={[234, 179, 8]} endRGB={[249, 115, 22]} // 黄色からオレンジへのグラデーション
          />
        </div>

        {/* リアルタイム結果表示 */}
        <div className="pt-10 border-t border-[#E5E0D8] space-y-4">
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