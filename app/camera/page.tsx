'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      
      <div className="max-w-md w-full space-y-6">
        {/* ヘッダー部分 */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif font-bold text-amber-500 tracking-widest">AI 人相診断</h2>
          <p className="text-sm opacity-70">あなたの表情から、今日ぴったりの一杯を見つけます</p>
        </div>

        {/* メイン画面エリア */}
        <div className="relative aspect-[3/4] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
          
          {/* エラー表示 */}
          {errorMsg && (
            <div className="p-6 text-center text-red-400 font-bold text-sm">
              {errorMsg}
            </div>
          )}

          {/* 状態1: カメラ起動前 */}
          {!isCameraActive && !capturedImage && !errorMsg && (
            <div className="text-center p-8 space-y-6">
              <div className="w-24 h-24 mx-auto bg-slate-700 rounded-full flex items-center justify-center text-amber-500">
                <Camera size={40} />
              </div>
              <p className="text-sm opacity-80 leading-relaxed">
                明るい場所で、お顔がはっきりと<br/>写るように撮影してください。
              </p>
              <button 
                onClick={startCamera}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
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
              className="w-full h-full object-cover transform -scale-x-100"
            />
            
            {/* ガイド枠（顔を合わせる円） */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pb-20">
               <div className="w-48 h-64 border-2 border-white/40 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
               <p className="mt-4 text-white/80 text-sm font-bold tracking-widest">枠の中に顔を合わせてください</p>
            </div>

            {/* 撮影ボタン */}
            <div className="absolute bottom-8 left-0 w-full flex justify-center gap-6 px-8">
              <button 
                onClick={stopCamera}
                className="w-14 h-14 bg-slate-800/80 rounded-full flex items-center justify-center text-white backdrop-blur shadow-lg border border-white/20 active:scale-95"
              >
                <X size={24} />
              </button>
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 bg-white/30 rounded-full flex items-center justify-center backdrop-blur shadow-xl border-4 border-white/50 active:scale-90 transition-transform"
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
              
              {/* スキャンエフェクト（モック） */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)] absolute top-0 animate-[scan_3s_ease-in-out_infinite_alternate]" />
              </div>

              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 pt-20 pb-8 px-6 flex justify-between gap-4">
                <button 
                  onClick={retakePhoto}
                  className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl border border-white/10 flex items-center justify-center gap-2 active:scale-95"
                >
                  <RefreshCw size={20} /> 撮り直す
                </button>
                <button 
                  onClick={proceedToDiagnosis}
                  className="flex-1 py-4 bg-amber-600 text-white font-bold rounded-2xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 active:scale-95"
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
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}} />
    </div>
  );
}