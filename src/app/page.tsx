"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Copy, CheckCircle2, Image as ImageIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!resultId) return;
    // Vercel serverless functions fall asleep quickly and clear memory.
    // This ping keeps the server instance awake for as long as the webpage is open!
    const interval = setInterval(() => {
      fetch(`/api/image/${resultId}`, { method: 'HEAD' }).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [resultId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResultId(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResultId(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/convert", {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setResultId(data.id);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!resultId) return;
    navigator.clipboard.writeText(resultId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex-1 w-full bg-gradient-premium flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-600/20 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl mx-auto z-10 space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-500">
            Image to RBLX
          </h1>
          <p className="text-zinc-400 text-lg">
            Convert any image into RGBA data for Roblox instantly.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="space-y-6">
            {/* Upload Zone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative group cursor-pointer border-2 border-dashed rounded-2xl p-10 transition-all duration-300",
                preview ? "border-violet-500/50 bg-violet-500/10" : "border-zinc-700 bg-zinc-800/30 hover:border-violet-500/50 hover:bg-zinc-800/50"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
              />
              
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center gap-4"
                  >
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Preview" className="w-48 h-48 object-cover rounded-xl shadow-lg border border-white/10" />
                    <p className="text-sm font-medium text-violet-300">Click to change image</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 text-zinc-400 group-hover:text-violet-300 transition-colors"
                  >
                    <div className="p-4 bg-zinc-800 rounded-full shadow-inner">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <span className="font-semibold text-zinc-200">Click to upload</span> or drag and drop<br />
                      <span className="text-sm">PNG, JPG, or WEBP (Max 256x256 rec.)</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="relative overflow-hidden w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Convert to RGBA
                  </>
                )}
                {/* Button shine effect */}
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                  <div className="relative h-full w-8 bg-black/10 blur" />
                </div>
              </button>
            </div>

            {/* Results */}
            <AnimatePresence>
              {resultId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-6 border-t border-white/10 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                       <CheckCircle2 className="w-5 h-5 text-green-400" />
                       Success!
                    </h3>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-pink-500/20 rounded-xl blur-md" />
                    <div className="relative bg-black/50 border border-zinc-700 p-6 rounded-xl backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="mb-4">
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 tracking-widest font-mono shadow-sm">
                          {resultId}
                        </span>
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className="flex items-center justify-center w-full max-w-[200px] gap-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 px-4 rounded-xl transition-all active:scale-95"
                      >
                        {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                        {copied ? "Code Copied!" : "Copy Code"}
                      </button>
                      <p className="mt-4 text-zinc-500 text-xs text-center">
                        Players can type this exact code into your game UI!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </motion.div>
    </main>
  );
}
