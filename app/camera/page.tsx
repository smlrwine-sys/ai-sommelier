'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, ChevronLeft, Settings } from 'lucide-react';

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
            
            {/* 影オーバーレイ */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-black/50" />
            
            {/* ② ガイド枠（顔認証風SVG） */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pb-20 z-20">
                {/* SVGガイド：ビデオに合わせて左右反転 */}
                <svg viewBox="0 0 200 250" className="w-48 h-64 text-white/60 transform -scale-x-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {/* 顔の輪郭 */}
                    <path d="M 100,20 C 130,20 160,40 160,80 C 160,120 150,150 140,180 C 130,210 100,230 100,230 C 100,230 70,210 60,180 C 50,150 40,120 40,80 C 40,40 70,20 100,20 Z" />
                    {/* 左目 */}
                    <ellipse cx="75" cy="90" rx="15" ry="8" />
                    <circle cx="75" cy="90" r="3" fill="currentColor"/>
                    {/* 右目 */}
                    <ellipse cx="125" cy="90" rx="15" ry="8" />
                    <circle cx="125" cy="90" r="3" fill="currentColor"/>
                    {/* 鼻 */}
                    <path d="M 100,100 L 100,140" strokeWidth="2.5"/>
                    <path d="M 95,140 L 105,140" strokeWidth="2"/>
                    {/* 口 */}
                    <path d="M 80,170 C 90,180 110,180 120,170 M 80,170 L 120,170 Z" />
                    {/* コーナーの飾り線 */}
                    <path d="M 20,20 L 40,20 M 20,20 L 20,40" stroke="white" />
                    <path d="M 180,20 L 160,20 M 180,20 L 180,40" stroke="white" />
                    <path d="M 20,230 L 40,230 M 20,230 L 20,210" stroke="white" />
                    <path d="M 180,230 L 160,230 M 180,230 L 180,210" stroke="white" />
                </svg>
               <p className="mt-6 text-white/90 text-xs font-black tracking-[0.2em] bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm uppercase">枠の中に顔を合わせてください</p>
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

          {/* 状態3: 撮影完了（画像確認） */}
          {capturedImage && (
            <div className="absolute inset-0 w-full h-full z-20 bg-slate-900">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              
              {/* ③ スキャンエフェクト ＋ プログラミング用語 */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                {/* オレンジの移動線 */}
                <div className="w-full h-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)] absolute top-0 animate-[scan_3s_ease-in-out_infinite_alternate]" />
                
                {/* 打ち込まれる用語（白テキスト） */}
                <div className="absolute inset-0 p-8 font-mono text-[10px] text-white/90 space-y-1.5 pt-10 text-left">
                    <p className="animate-typing-1 whitespace-nowrap overflow-hidden">NeuralNetwork::AnalyzeExpression()</p>
                    <p className="animate-typing-2 whitespace-nowrap overflow-hidden delay-100">{'>> Extracting: EmotionValue...'}</p>
                    <p className="animate-typing-3 whitespace-nowrap overflow-hidden delay-300">{'>> Extracting: TasteParams...'}</p>
                    <p className="animate-typing-4 whitespace-nowrap overflow-hidden delay-500 text-amber-300">FeatureDetect: Positive(0.85)</p>
                    <p className="animate-typing-5 whitespace-nowrap overflow-hidden delay-700">{'>> db.wines.filter(best_match)...'}</p>
                    <p className="animate-typing-6 whitespace-nowrap overflow-hidden delay-1000 tracking-wider text-green-400 font-bold">Result: SUCCESS</p>
                </div>
              </div>

              {/* ボタンエリア */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-40 pb-8 px-6 flex justify-between gap-4 z-30">
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

        /* ③ 文字打ち込みのアニメーション */
        @keyframes typing { from { width: 0 } to { width: 100% } }
        
        /* それぞれのテキストの文字数に合わせてsteps()を調整 */
        .animate-typing-1 { animation: typing 0.8s steps(28) forwards; }
        .animate-typing-2 { animation: typing 0.6s steps(27) forwards; }
        .animate-typing-3 { animation: typing 0.6s steps(25) forwards; }
        .animate-typing-4 { animation: typing 0.8s steps(29) forwards; }
        .animate-typing-5 { animation: typing 0.9s steps(33) forwards; }
        .animate-typing-6 { animation: typing 0.5s steps(15) forwards; }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float-slow 4s infinite ease-in-out; }
      `}} />
    </div>
  );
}