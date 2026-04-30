'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, ChevronLeft } from 'lucide-react';

// === 近未来的な文字表示コンポーネント (Glitchエフェクト) ===
const GlitchText = ({ text }: { text: string }) => {
  const [display, setDisplay] = useState('');
  
  useEffect(() => {
    let iter = 0;
    const timer = setInterval(() => {
      setDisplay(text.split('').map((char, index) => {
        if (index < iter) return char;
        // ランダムな記号や英数字を生成して文字化けを演出
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(''));
      
      iter += 0.5; // 文字が確定していくスピード
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
  
  // 常に高速で変動し続けるランダム値（近未来感の演出）
  useEffect(() => {
    const timer = setInterval(() => {
      setHash1(Math.random().toString(16).substring(2, 10).toUpperCase());
      setHash2((Math.random() * 100).toFixed(4));
    }, 80);
    return () => clearInterval(timer);
  }, []);

  // 順番に表示される解析ログ
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
        {/* 顔の輪郭（丸みを持たせて人間の顔の比率に） */}
        <path d="M 100,20 C 145,20 165,60 165,120 C 165,170 135,220 100,230 C 65,220 35,170 35,120 C 35,60 55,20 100,20 Z" />
        
        {/* 目（黒目を消してアーチ型の線に） */}
        <path d="M 65,115 Q 75,105 85,115" />
        <path d="M 115,115 Q 125,105 135,115" />
        
        {/* 鼻 */}
        <path d="M 100,115 L 100,160" />
        <path d="M 94,160 L 106,160" />
        
        {/* 口 */}
        <path d="M 75,190 Q 100,200 125,190" />
        
        {/* コーナーの飾り線（顔認証システム風） */}
        <path d="M 10,10 L 40,10 M 10,10 L 10,40" stroke="white" strokeWidth="3" />
        <path d="M 190,10 L 160,10 M 190,10 L 190,40" stroke="white" strokeWidth="3" />
        <path d="M 10,230 L 40,230 M 10,230 L 10,200" stroke="white" strokeWidth="3" />
        <path d="M 190,230 L 160,230 M 190,230 L 190,200" stroke="white" strokeWidth="3" />
        
        {/* センターのクロスライン（照準） */}
        <line x1="100" y1="10" x2="100" y2="30" stroke="white" strokeWidth="1" opacity="0.5"/>
        <line x1="100" y1="210" x2="100" y2="230" stroke="white" strokeWidth="1" opacity="0.5"/>
        <line x1="10" y1="120" x2="30" y2="120" stroke="white" strokeWidth="1" opacity="0.5"/>
        <line x1="170" y1="120" x2="190" y2="120" stroke="white" strokeWidth="1" opacity="0.5"/>
    </svg>
  </div>
);


export default function FaceReadingUI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. カメラを起動する
  const startCamera = async () => {
    setErrorMsg('');
    setCapturedImage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', // インカメラを優先
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setErrorMsg('カメラへのアクセスが拒否されたか、見つかりませんでした。ブラウザの設定をご確認ください。');
    }
  };

  // 2. カメラを停止する
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  }, [stream]);

  // 3. 写真を撮影する
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // キャンバスのサイズをビデオのサイズに合わせる
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // 画像を反転させる（鏡像にする）
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // base64形式で画像データを取得
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera(); // 撮影したらカメラを止める
      }
    }
  };

  // 4. 撮影をやり直す
  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // 5. 診断へ進む（今回はモック処理）
  const proceedToDiagnosis = () => {
    alert("この画像をサーバーに送信してAI診断を開始します！\n\n（※本番ではここにAPI通信処理が入ります）");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* 導線追加のための閉じるボタン（将来用） */}
      <div className="absolute top-6 left-6 z-[100]">
          <button onClick={() => alert("トップへ戻る")} className="p-3 bg-white/10 rounded-full text-white backdrop-blur-md active:scale-95">
              <ChevronLeft size={24}/>
          </button>
      </div>

      {/* 背景のSFっぽい光輪 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_60%)] animate-pulse pointer-events-none" />

      <div className="max-w-md w-full space-y-6 pt-16 relative z-10">
        {/* ヘッダー部分 */}
        <div className="text-center space-y-2">
          {/* ① 文言変更：人相診断 -> 表情診断 */}
          <h2 className="text-2xl font-serif font-bold text-amber-500 tracking-widest">AI 表情診断</h2>
          <p className="text-sm opacity-70">あなたの表情から、今日ぴったりの一杯を見つけます</p>
        </div>

        {/* メイン画面エリア */}
        <div className="relative aspect-[3/4] bg-slate-800 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/5 flex items-center justify-center">
          
          {/* エラー表示 */}
          {errorMsg && (
            <div className="p-6 text-center text-red-400 font-bold text-sm z-30 relative">
              {errorMsg}
            </div>
          )}

          {/* 状態1: カメラ起動前 */}
          {!isCameraActive && !capturedImage && !errorMsg && (
            <div className="text-center p-8 space-y-6 relative z-10">
              <div className="w-24 h-24 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center text-amber-500 border border-white/5 shadow-xl">
                <Camera size={40} className="animate-float" />
              </div>
              <p className="text-sm opacity-80 leading-relaxed font-medium">
                明るい場所で、お顔がはっきりと<br/>写るように撮影してください。
              </p>
              <button 
                onClick={startCamera}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95"
              >
                カメラを起動する
              </button>
            </div>
          )}

          {/* 状態2: カメラ起動中（映像プレビュー） */}
          <div className={`absolute inset-0 w-full h-full ${isCameraActive ? 'opacity-100 z-10' : 'opacity-0 z-[-1]'}`}>
            {/* video は鏡像（scaleX(-1)）で表示させるのが自然 */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform -scale-x-100 z-10"
            />
            
            {/* 影オーバーレイ（暗くしてガイドを目立たせる） */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-black/30" />
            
            {/* ② ガイド枠（顔認証風SVG） */}
            <FaceGuide />
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pb-20 z-20">
               <div className="w-[70%] max-w-[280px] h-auto aspect-[5/6] flex items-end justify-center">
                 <p className="mt-6 text-white/90 text-[10px] sm:text-xs font-black tracking-[0.2em] bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm uppercase translate-y-8">枠の中に顔を合わせてください</p>
               </div>
            </div>

            {/* 撮影ボタン */}
            <div className="absolute bottom-8 left-0 w-full flex justify-center gap-6 px-8 z-30">
              <button 
                onClick={stopCamera}
                className="w-14 h-14 bg-slate-800/80 rounded-full flex items-center justify-center text-white backdrop-blur shadow-lg border border-white/20 active:scale-95 transition-colors hover:bg-red-950"
              >
                <X size={24} />
              </button>
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur shadow-xl border-4 border-white active:scale-90 transition-transform"
              >
                <div className="w-16 h-16 bg-white rounded-full shadow-inner" />
              </button>
              <div className="w-14 h-14" /> {/* 右側のスペース調整用 */}
            </div>
          </div>

          {/* 状態3: 撮影完了（画像確認 ＋ AI解析演出） */}
          {capturedImage && (
            <div className="absolute inset-0 w-full h-full z-20 bg-slate-900">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              
              {/* 暗転オーバーレイ */}
              <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />

              {/* ② 撮影後にも顔ガイドを表示 */}
              <FaceGuide />

              {/* ③ スキャンエフェクト ＋ ランダムプログラミング用語 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
                {/* オレンジの移動線 */}
                <div className="w-full h-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)] absolute top-0 animate-[scan_2.5s_ease-in-out_infinite_alternate]" />
                
                {/* 打ち込まれる用語コンポーネント */}
                <CyberTerminal />
              </div>

              {/* ボタンエリア */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-40 pb-8 px-6 flex justify-between gap-4 z-40">
                <button 
                  onClick={retakePhoto}
                  className="flex-1 py-4 bg-slate-800/80 text-white font-bold rounded-2xl border border-white/10 backdrop-blur-sm flex items-center justify-center gap-2 active:scale-95 transition-colors hover:bg-slate-700"
                >
                  <RefreshCw size={19} /> 撮り直す
                </button>
                <button 
                  onClick={proceedToDiagnosis}
                  className="flex-1 py-4 bg-amber-600/90 text-white font-black rounded-2xl shadow-lg shadow-amber-600/20 backdrop-blur-sm flex items-center justify-center gap-2 active:scale-95 transition-colors hover:bg-amber-500"
                >
                  <Check size={20} /> 診断する
                </button>
              </div>
            </div>
          )}

          {/* 見えないキャンバス（画像生成用） */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* スキャンラインのアニメーション */
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }

        /* ふわふわ浮くアニメーション */
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float-slow 4s infinite ease-in-out; }
      `}} />
    </div>
  );
}