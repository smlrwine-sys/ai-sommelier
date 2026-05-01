'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, ChevronLeft, Quote, MessageCircle, Info } from 'lucide-react';

// === 近未来的な文字表示コンポーネント (Glitchエフェクト) ===
const GlitchText = ({ text }: { text: string }) => {
  const [display, setDisplay] = useState('');
  
  useEffect(() => {
    let iter = 0;
    const timer = setInterval(() => {
      setDisplay(text.split('').map((char, index) => {
        if (index < iter) return char;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(''));
      
      iter += 0.5;
      if (iter > text.length) clearInterval(timer);
    }, 40);
    
    return () => clearInterval(timer);
  }, [text]);

  return <span>{display}</span>;
};

// === 左上に表示されるサイバー風ターミナル ===
const CyberTerminal = () => {
  const [hash1, setHash1] = useState('00000000');
  const [hash2, setHash2] = useState('0.0000');
  
  useEffect(() => {
    const timer = setInterval(() => {
      setHash1(Math.random().toString(16).substring(2, 10).toUpperCase());
      setHash2((Math.random() * 100).toFixed(4));
    }, 80);
    return () => clearInterval(timer);
  }, []);

  const [logs, setLogs] = useState<string[]>([]);
  useEffect(() => {
    const sequence = [
      "INITIALIZING SCAN...",
      "TARGET ACQUIRED",
      "ANALYZING FACIAL LANDMARKS",
      "EXTRACTING EMOTION VECTORS",
      "CALCULATING TASTE PARAMS...",
      "MATCHING WINE DATABASE..."
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i < sequence.length) {
        setLogs(prev => [...prev, sequence[sequence.indexOf(prev[prev.length - 1]) + 1 || 0]]);
        i++;
      }
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-6 left-6 font-mono text-[10px] sm:text-xs leading-tight z-30 pointer-events-none text-left">
      <div className="mb-4 text-amber-400/90 drop-shadow-[0_0_2px_rgba(245,158,11,0.8)] space-y-0.5">
         <div>SYS_PROC: 0x{hash1}</div>
         <div>VAR_FLUX: {hash2}</div>
      </div>
      <div className="space-y-1 text-white/90 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
         {logs.map((log, idx) => (
           <div key={idx} className="flex gap-2">
             <span className="opacity-50 text-amber-500">{'>'}</span>
             <GlitchText text={log} />
           </div>
         ))}
      </div>
    </div>
  );
};

// === 顔の輪郭ガイド（SVG） ===
const FaceGuide = () => (
  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pb-20 z-20">
    <svg viewBox="0 0 200 240" className="w-[70%] max-w-[280px] h-auto text-white/40 transform -scale-x-100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M 100,20 C 145,20 165,60 165,120 C 165,170 135,220 100,230 C 65,220 35,170 35,120 C 35,60 55,20 100,20 Z" />
        <path d="M 65,115 Q 75,105 85,115" />
        <path d="M 115,115 Q 125,105 135,115" />
        <path d="M 100,115 L 100,160" />
        <path d="M 94,160 L 106,160" />
        <path d="M 75,190 Q 100,200 125,190" />
        <path d="M 10,10 L 40,10 M 10,10 L 10,40" stroke="white" strokeWidth="3" />
        <path d="M 190,10 L 160,10 M 190,10 L 190,40" stroke="white" strokeWidth="3" />
        <path d="M 10,230 L 40,230 M 10,230 L 10,200" stroke="white" strokeWidth="3" />
        <path d="M 190,230 L 160,230 M 190,230 L 190,200" stroke="white" strokeWidth="3" />
        <line x1="100" y1="10" x2="100" y2="30" stroke="white" strokeWidth="1" opacity="0.5"/>
        <line x1="100" y1="210" x2="100" y2="230" stroke="white" strokeWidth="1" opacity="0.5"/>
        <line x1="10" y1="120" x2="30" y2="120" stroke="white" strokeWidth="1" opacity="0.5"/>
        <line x1="170" y1="120" x2="190" y2="120" stroke="white" strokeWidth="1" opacity="0.5"/>
    </svg>
  </div>
);

// --- モックデータ（店舗のワインリストを想定） ---
const DUMMY_WINES = [
  { id: '1', name: 'シャトー・パシオン', producer: 'ドメーヌ・ルージュ', type: '赤', origin: 'フランス', grape: 'カベルネ・ソーヴィニヨン', image_url: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&w=400&q=80' },
  { id: '2', name: 'ヴィンテージ・スマイル', producer: 'ハッピー・ヴィンヤード', type: '白', origin: 'ニュージーランド', grape: 'シャルドネ', image_url: 'https://images.unsplash.com/photo-1569919659476-f0852f68288d?auto=format&fit=crop&w=400&q=80' },
  { id: '3', name: 'ミステリアス・シラー', producer: 'ダーク・エステート', type: '赤', origin: 'オーストラリア', grape: 'シラーズ', image_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80' }
];

export default function FaceReadingUI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 画面のステート: 'camera' (撮影前〜確認) | 'loading' (ホワイトアウト) | 'result' (診断結果)
  const [view, setView] = useState<'camera' | 'loading' | 'result'>('camera');

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  // 診断結果を保持するステート
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);

  const startCamera = async () => {
    setErrorMsg('');
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Camera error:", err);
      setErrorMsg('カメラへのアクセスが拒否されたか、見つかりませんでした。ブラウザの設定をご確認ください。');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // 診断するボタンを押した時の処理
  const proceedToDiagnosis = () => {
    // 1. ローディング画面（ホワイトアウト）へ移行
    setView('loading');

    // 2. モックで診断結果を生成し、URLを独自のものにする
    setTimeout(() => {
      setDiagnosticResult({
        taste: { body: 4, acidity: 3, tannin: 5, sweetness: 1 },
        title: "情熱のフルボディ・スマイル",
        // ↓追加：スコア、アロマ、品種データ
        scores: { 
          award: Math.floor(Math.random() * 11) + 85, // 85〜95のランダム
          rank: Math.floor(Math.random() * 50) + 1,   // 1〜50位
          peakAge: Math.floor(Math.random() * 10) + 1, // 1〜10年後
          area: '港区' // ※本番ではお店のデータ(store.area)等と連携させます
        },
        aromas: ['ブラックベリー', 'ダークチョコ', '黒胡椒'],
        grapes: [
          { name: 'カベルネ・ソーヴィニヨン', description: '力強いタンニンと深いコクを持つ、ワインの王様。骨格のしっかりしたあなたに。' },
          { name: 'シラー', description: 'スパイシーでエネルギッシュ。あなたのその情熱的な笑顔を引き立てる品種です。' },
          { name: 'マルベック', description: '果実味が豊かで、どこかミステリアスな魅力を持つ。奥深い表情にマッチします。' }
        ],
        comment: "あなたの力強く自信に満ちた表情から、しっかりとした骨格と深いコクを持つフルボディの赤ワインがぴったりだと判断しました。今日のディナーは少し贅沢にステーキなどはいかがでしょうか。",
        wines: DUMMY_WINES
      });
      
      // 診断結果用の独自URL（ハッシュ）を生成（履歴に残るように）
      const uniqueId = Math.random().toString(36).substring(2, 10);
      window.history.pushState({}, '', `?face_id=${uniqueId}`);
      
      setView('result');
    }, 2500); // 2.5秒のホワイトアウト演出
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans relative overflow-hidden">
      
      {/* 画面1: カメラ＆プレビュー画面 */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 transition-opacity duration-500 ${view === 'camera' ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute top-6 left-6 z-[100]">
            <button onClick={() => alert("トップへ戻る")} className="p-3 bg-white/10 rounded-full text-white backdrop-blur-md active:scale-95">
                <ChevronLeft size={24}/>
            </button>
        </div>

        <div className="max-w-md w-full space-y-6 pt-16 relative z-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-serif font-bold text-amber-500 tracking-widest">AI 表情診断</h2>
            <p className="text-sm opacity-70">あなたの表情から、今日ぴったりの一杯を見つけます</p>
          </div>

          <div className="relative aspect-[3/4] bg-slate-800 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/5 flex items-center justify-center">
            {errorMsg && <div className="p-6 text-center text-red-400 font-bold text-sm z-30 relative">{errorMsg}</div>}

            {!isCameraActive && !capturedImage && !errorMsg && (
              <div className="text-center p-8 space-y-6 relative z-10">
                <div className="w-24 h-24 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center text-amber-500 border border-white/5 shadow-xl">
                  <Camera size={40} className="animate-float" />
                </div>
                <p className="text-sm opacity-80 leading-relaxed font-medium">明るい場所で、お顔がはっきりと<br/>写るように撮影してください。</p>
                <button onClick={startCamera} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95">カメラを起動する</button>
              </div>
            )}

            <div className={`absolute inset-0 w-full h-full ${isCameraActive ? 'opacity-100 z-10' : 'opacity-0 z-[-1]'}`}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100 z-10" />
              <div className="absolute inset-0 pointer-events-none z-10 bg-black/30" />
              <FaceGuide />
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pb-20 z-20">
                 <div className="w-[70%] max-w-[280px] h-auto aspect-[5/6] flex items-end justify-center">
                   <p className="mt-6 text-white/90 text-[10px] sm:text-xs font-black tracking-[0.2em] bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm uppercase translate-y-8">枠の中に顔を合わせてください</p>
                 </div>
              </div>
              <div className="absolute bottom-8 left-0 w-full flex justify-center gap-6 px-8 z-30">
                <button onClick={stopCamera} className="w-14 h-14 bg-slate-800/80 rounded-full flex items-center justify-center text-white backdrop-blur shadow-lg border border-white/20 active:scale-95"><X size={24} /></button>
                <button onClick={capturePhoto} className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur shadow-xl border-4 border-white active:scale-90"><div className="w-16 h-16 bg-white rounded-full shadow-inner" /></button>
                <div className="w-14 h-14" />
              </div>
            </div>

            {capturedImage && (
              <div className="absolute inset-0 w-full h-full z-20 bg-slate-900">
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
                
                {/* ① 撮影後にも顔ガイドを表示 */}
                <FaceGuide />
                
                {/* ① 復活：スキャンエフェクト ＋ プログラミング用語 */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                  {/* オレンジの移動線 */}
                  <div className="w-full h-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)] absolute top-0 animate-[scan_2.5s_ease-in-out_infinite_alternate]" />
                  {/* 打ち込まれる用語コンポーネント */}
                  <CyberTerminal />
                </div>

                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-40 pb-8 px-6 flex justify-between gap-4 z-40">
                  <button onClick={retakePhoto} className="flex-1 py-4 bg-slate-800/80 text-white font-bold rounded-2xl border border-white/10 backdrop-blur-sm flex items-center justify-center gap-2 active:scale-95"><RefreshCw size={19} /> 撮り直す</button>
                  <button onClick={proceedToDiagnosis} className="flex-1 py-4 bg-amber-600/90 text-white font-black rounded-2xl shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 active:scale-95"><Check size={20} /> 診断する</button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      </div>

      {/* 画面2: シンプルなローディング（ホワイトアウト演出） */}
      {view === 'loading' && (
        <div className="absolute inset-0 z-50 bg-white animate-whiteout flex items-center justify-center pointer-events-none">
           {/* 何も表示せず、ただ真っ白になるだけ */}
        </div>
      )}

      {/* 画面3: 診断結果画面 */}
      {view === 'result' && diagnosticResult && (
        <div className="absolute inset-0 z-40 bg-[#FAF9F6] text-slate-900 overflow-y-auto hide-scrollbar animate-fade-in">
          {/* ヘッダー */}
          <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
            <button onClick={() => setView('camera')} className="p-2 -ml-2"><ChevronLeft size={24} /></button>
            <h1 className="font-serif font-black tracking-widest text-sm">AI 表情診断結果</h1>
            <div className="w-10" />
          </div>

          <div className="max-w-md mx-auto p-6 pb-20 space-y-12">
            
            {/* ① 撮影した顔がワイングラスにはめ込まれる演出 */}
            <div className="flex flex-col items-center pt-8">
              <div className="relative w-48 h-[250px] animate-float">
                 
                 {/* ↓追加：グラスの周りに浮遊するアロマ */}
                 {diagnosticResult.aromas && diagnosticResult.aromas.map((aroma: string, idx: number) => {
                   const positions = [
                     "top-4 -left-16",   // 左上
                     "top-24 -right-16", // 右中
                     "bottom-12 -left-10" // 左下
                   ];
                   return (
                     <div key={idx} 
                          className={`absolute ${positions[idx]} bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-[#E5E0D8] z-20 animate-float text-[10px] font-bold text-[#A82B3B] whitespace-nowrap`}
                          style={{ animationDelay: `${idx * 0.7}s` }}>
                       ✨ {aroma}
                     </div>
                   );
                 })}

                 {/* ② ワイングラスのボウル部分（白/透明ベースに変更） */}
                 <div className="absolute inset-x-0 top-0 h-[180px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.15)] z-10 border border-white/60" 
                      style={{ borderRadius: '40% 40% 45% 45% / 10% 10% 45% 45%', backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(8px)' }}>
                   {/* 撮影画像 (ワインの色味と合わせるためluminosityでブレンド) */}
                   <img src={capturedImage || ''} className="w-full h-full object-cover opacity-60 mix-blend-luminosity transform -scale-x-100" />
                   {/* ワインの液体っぽいグラデーションオーバーレイ */}
                   <div className="absolute inset-0 bg-gradient-to-t from-[#A82B3B]/90 via-[#A82B3B]/50 to-transparent mix-blend-multiply" />
                   {/* グラスのハイライト（光の反射） */}
                   <div className="absolute top-4 left-4 w-6 h-32 bg-white/50 blur-md rounded-full transform rotate-12" />
                 </div>
                 {/* グラスの脚（ステム）と台座（ベース） */}
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-0">
                    <div className="w-2.5 h-[80px] bg-gradient-to-r from-gray-200 via-white to-gray-300 opacity-80 shadow-sm" />
                    <div className="w-28 h-3 bg-gradient-to-t from-gray-300 to-white/90 rounded-[50%] shadow-md mt-[-2px]" />
                 </div>
              </div>
              
              {/* ③ 注意書きの追加 */}
              <div className="mt-8 px-5 py-4 bg-[#A82B3B]/5 rounded-2xl text-center border border-[#A82B3B]/10 w-full">
                <p className="text-[10px] sm:text-xs font-bold text-[#A82B3B] leading-relaxed flex items-start gap-2 text-left">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <span>
                    プライバシー保護のため、撮影した画像は24時間で自動消去されます。結果はスクリーンショットやシェア機能で保存してください。
                  </span>
                </p>
              </div>
            </div>

            {/* ② あなたの表情分析 */}
            <div className="text-center space-y-6">
              <div className="space-y-3">
                <h2 className="text-[10px] font-black text-[#A82B3B] tracking-[0.3em] uppercase">あなたの表情分析</h2>
                <h3 className="text-3xl font-serif font-black leading-tight drop-shadow-sm">{diagnosticResult.title}</h3>
              </div>
              
              {/* ↓追加：表情から算出された数値スコア群 */}
              {diagnosticResult.scores && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#E5E0D8] flex flex-col items-center justify-center">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 text-center">AI WINE<br/>AWARD</span>
                    <span className="text-xl font-serif font-black text-[#A82B3B]">{diagnosticResult.scores.award}<span className="text-[10px]">pt</span></span>
                  </div>
                  <div className="bg-[#1A1A1A] p-3 rounded-2xl shadow-lg border border-[#1A1A1A] flex flex-col items-center justify-center">
                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-tighter mb-1 text-center">{diagnosticResult.scores.area}<br/>ランキング</span>
                    <span className="text-xl font-serif font-black text-white">{diagnosticResult.scores.rank}<span className="text-[10px]">位</span></span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#E5E0D8] flex flex-col items-center justify-center">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-1 text-center">あなたの<br/>飲み頃</span>
                    <span className="text-xl font-serif font-black text-[#A82B3B]">+{diagnosticResult.scores.peakAge}<span className="text-[10px]">年</span></span>
                  </div>
                </div>
              )}
            </div>

            {/* ③ パラメーター表示 */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#E5E0D8] space-y-5">
              {[
                { label: 'ボディ', value: diagnosticResult.taste.body },
                { label: '酸味', value: diagnosticResult.taste.acidity },
                { label: 'タンニン', value: diagnosticResult.taste.tannin },
                { label: '甘味', value: diagnosticResult.taste.sweetness },
              ].map(p => (
                <div key={p.label} className="flex items-center gap-4">
                  <span className="w-16 text-xs font-bold text-gray-500 uppercase tracking-widest">{p.label}</span>
                  <div className="flex-1 flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(v => (
                      <div key={v} className={`h-2.5 flex-1 rounded-full ${v <= p.value ? 'bg-[#A82B3B]' : 'bg-gray-100'}`} />
                    ))}
                  </div>
                  <span className="w-4 text-right text-lg font-black font-serif text-[#1A1A1A]">{p.value}</span>
                </div>
              ))}
            </div>

            {/* ④ AIのコメント */}
            <div className="bg-[#0A1F11] text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <Quote className="absolute top-6 left-6 opacity-10 w-16 h-16" />
              <p className="relative z-10 leading-loose text-sm font-serif font-medium">{diagnosticResult.comment}</p>
            </div>

            {/* ⑤ 近似値のワインTOP3 */}
            <div className="space-y-4">
              <div className="flex items-end justify-between border-b border-[#E5E0D8] pb-2">
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">あなたの味わいに近いワイン TOP3</h3>
              </div>
              <div className="space-y-3">
                {diagnosticResult.wines.map((wine: any, idx: number) => (
                  <a key={wine.id} href={`/?store_id=test&jan=${wine.id}`} className="block bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:border-[#A82B3B]/50 transition-all active:scale-[0.98]">
                    <div className="w-8 h-8 bg-[#A82B3B] text-white rounded-full flex items-center justify-center font-serif font-bold text-sm shrink-0 shadow-md">
                      {idx + 1}
                    </div>
                    <div className="w-16 h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                      <img src={wine.image_url} className="h-full object-contain p-2 drop-shadow-md" alt={wine.name} />
                    </div>
                    <div className="flex-1 text-left space-y-1">
                      <p className="font-black text-[15px] leading-tight text-[#1A1A1A]">{wine.name}</p>
                      <p className="text-xs text-[#A82B3B] font-bold font-serif">{wine.producer}</p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[9px] font-bold">{wine.type}ワイン</span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[9px] font-bold">{wine.origin}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium mt-1 truncate">品種: {wine.grape}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* ↓追加：あなたに近い品種TOP3 */}
            {diagnosticResult.grapes && (
              <div className="space-y-4 pt-4">
                <div className="flex items-end justify-between border-b border-[#E5E0D8] pb-2">
                  <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">あなたに近い品種 TOP3</h3>
                </div>
                <div className="space-y-3">
                  {diagnosticResult.grapes.map((grape: any, idx: number) => (
                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-start">
                      <div className="w-8 h-8 bg-[#0A1F11] text-white rounded-full flex items-center justify-center font-serif font-bold text-sm shrink-0 shadow-md mt-1">
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-black text-[15px] leading-tight text-[#1A1A1A] mb-1">{grape.name}</p>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">{grape.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ⑥ 診断結果をシェアする */}
            <div className="pt-8 pb-10 space-y-5 text-center">
              <p className="text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase">診断結果をシェアする</p>
              <div className="flex justify-center gap-6">
                <button onClick={() => alert("LINEでシェア")} className="w-14 h-14 bg-[#06C755] text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform"><MessageCircle size={24} /></button>
                <button onClick={() => alert("URLをコピー")} className="w-14 h-14 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white rounded-2xl flex items-center justify-center shadow-md hover:scale-105 transition-transform"><Camera size={24} /></button>
                <button onClick={() => alert("Xでシェア")} className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-md font-bold text-xl hover:scale-105 transition-transform">X</button>
              </div>
            </div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        /* スキャンラインのアニメーション */
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }

        /* 文字打ち込みのアニメーション */
        @keyframes typing { from { width: 0 } to { width: 100% } }
        
        .animate-typing-1 { animation: typing 0.8s steps(28) forwards; }
        .animate-typing-2 { animation: typing 0.6s steps(27) forwards; }
        .animate-typing-3 { animation: typing 0.6s steps(25) forwards; }
        .animate-typing-4 { animation: typing 0.8s steps(29) forwards; }
        .animate-typing-5 { animation: typing 0.9s steps(33) forwards; }
        .animate-typing-6 { animation: typing 0.5s steps(15) forwards; }

        /* ホワイトアウトアニメーション (ローディング) */
        @keyframes whiteout {
          0% { background-color: rgba(255,255,255,0); }
          50% { background-color: rgba(255,255,255,1); }
          100% { background-color: rgba(255,255,255,1); }
        }
        .animate-whiteout {
          animation: whiteout 2.5s ease-in-out forwards;
        }

        /* フェードインアニメーション (結果画面表示用) */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float { animation: float-slow 4s infinite ease-in-out; }
        
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}