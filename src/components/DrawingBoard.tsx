import React, { useRef, useState, useEffect } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Eraser, Trash2, Wand2, Sparkles, X, ShoppingBag, Plus, Search, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ShoppingItem {
  store: string;
  name: string;
  price: string;
  url: string;
  score: string;
}

export function DrawingBoard({ userItems, onAddItem }: { userItems: any[], onAddItem?: (item: any) => void; key?: string }) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [color, setColor] = useState('#a855f7');
  const [eraserMode, setEraserMode] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ 
    match: any, 
    shopping: ShoppingItem[],
    description: string,
    vibe: string
  } | null>(null);

  const colors = ['#ffffff', '#000000', '#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#f59e0b'];

  const extractPrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const match = priceStr.replace(/,/g, '').match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const processedSuggestions = React.useMemo(() => {
    if (!aiResult) return [];
    let filtered = [...aiResult.shopping];
    if (maxPrice && !isNaN(Number(maxPrice))) {
      const max = Number(maxPrice);
      filtered = filtered.filter(item => extractPrice(item.price) <= max);
    }
    if (sortOrder === 'asc') {
      filtered.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
    } else if (sortOrder === 'desc') {
      filtered.sort((a, b) => extractPrice(b.price) - extractPrice(a.price));
    }
    return filtered;
  }, [aiResult, sortOrder, maxPrice]);

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
    setAiResult(null);
  };

  const handleDecipher = async () => {
    if (!canvasRef.current) return;
    setAiAnalyzing(true);
    setAiResult(null);
    try {
      const dataUrl = await canvasRef.current.exportImage('png');
      const base64Data = dataUrl.split(',')[1];
      
      const prompt = `
        Analyze this fashion sketch with extreme precision. 
        Your goal is to be a master fashion curator identifying the EXACT pieces implied by the drawing.
        
        1. Description: Provide a detailed, poetic description of the cut, material, and visual weight.
        2. Vibe: Identify the specific sub-culture aesthetic (e.g., Avant-garde Minimalist, Neo-Y2K, Quiet Luxury).
        3. Local Match: Find the closest match in: ${JSON.stringify(userItems.map(i => ({ id: i.id, name: i.name, category: i.category }))) }.
        4. Global Marketplace: Find 30 actual, accurate clothing items from major shopping sites (Amazon, ASOS, Zara, Nordstrom, H&M) that perfectly match the visual characteristics of the sketch. Do not fetch or generate image URLs.
        
        CRITICAL FOR LINKS:
        - Provide actual official retail site string names.
        - Generate a highly probable direct search URL for the retailer (e.g. "https://www.zara.com/search?searchTerm=item+name") in the shopLink field.

        Return ONLY valid JSON:
        {
          "description": "...",
          "vibe": "...",
          "matchedItemId": "...",
          "shoppingSuggestions": [
            { 
              "store": "Exact Retailer", 
              "name": "Full Product Name", 
              "price": "₹ Price",
              "shopLink": "Direct generated search URL for this store"
            }
          ]
        }
      `;
      
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: "image/png" } }
          ]
        }]
      });
      
      const text = response.text || '{}';
      const cleanJsonMatch = text.match(/\{[\s\S]*\}/);
      const cleanJson = cleanJsonMatch ? cleanJsonMatch[0] : '{}';
      const res = JSON.parse(cleanJson);
      let match = userItems.find(i => i.id === res.matchedItemId);
      
      setAiResult({
        match: match || null,
        shopping: res.shoppingSuggestions || [],
        description: res.description,
        vibe: res.vibe
      });
    } catch (e) {
      console.error(e);
      setAiResult({
          match: userItems[0],
          shopping: [],
          description: "A mysterious thread waiting to be woven.",
          vibe: "Unknown Essence"
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end mb-4 px-2">
          <div>
            <h3 className="font-serif text-3xl font-black text-white drop-shadow-md italic">Curation Studio</h3>
            <p className="text-[10px] text-fuchsia-300 uppercase tracking-widest font-black mt-1">Transmute Sketches to Outfits</p>
          </div>
      </div>

      <div className="bg-white/5 p-4 rounded-[40px] border border-lavender-400/20 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent pointer-events-none" />
        
        <div className="h-[45vh] w-full rounded-[2.5rem] overflow-hidden shadow-inner bg-[#0a0410] mb-6 border border-white/5 relative">
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={4}
            eraserWidth={25}
            strokeColor={eraserMode ? '#0a0410' : color}
            canvasColor="transparent"
            style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
          />
          {!eraserMode && <div className="absolute top-4 right-4 w-4 h-4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ backgroundColor: color }} />}
        </div>

        <div className="flex items-center justify-between gap-4 px-2">
            <div className="flex gap-2 p-1.5 bg-black/40 rounded-3xl overflow-x-auto scrollbar-none border border-white/5">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setEraserMode(false); }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${!eraserMode && color === c ? 'scale-110 border-white shadow-[0_0_10px_white]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex gap-2">
                <button 
                  onClick={() => setEraserMode(!eraserMode)}
                  className={`p-3.5 rounded-2xl transition-all shadow-lg ${eraserMode ? 'bg-fuchsia-500 text-white shadow-fuchsia-500/20' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  <Eraser size={20} />
                </button>
                <button 
                  onClick={handleClear}
                  className="p-3.5 rounded-2xl bg-white/5 text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all shadow-lg"
                >
                  <Trash2 size={20} />
                </button>
            </div>
        </div>

        <button 
          onClick={handleDecipher}
          disabled={aiAnalyzing}
          className="w-full mt-8 bg-gradient-to-r from-fuchsia-600 to-lavender-600 text-white font-black uppercase tracking-[0.3em] text-[10px] py-5 rounded-[2rem] shadow-2xl hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {aiAnalyzing ? (
            <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
          ) : (
            <><Wand2 size={20} /> Consult The Oracle</>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {aiAnalyzing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-6 p-8 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl relative overflow-hidden text-center flex flex-col items-center justify-center space-y-6"
          >
            <motion.div
              className="absolute inset-0 z-0"
              animate={{
                background: [
                  'radial-gradient(circle at 30% 30%, rgba(168,85,247,0.2) 0%, transparent 70%)',
                  'radial-gradient(circle at 70% 70%, rgba(217,70,239,0.2) 0%, transparent 70%)',
                  'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.3) 0%, transparent 70%)',
                ]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 4, ease: "linear" },
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
              }}
              className="relative z-10"
            >
              <div className="absolute inset-0 blur-2xl bg-lavender-500 rounded-full opacity-30 animate-pulse" />
              <Sparkles size={48} className="text-white relative z-10 shadow-2xl" />
            </motion.div>

            <div className="relative z-10 text-center">
              <h4 className="text-2xl font-serif italic text-white font-black mb-1">Synthesizing Essence</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-fuchsia-400 animate-pulse">Consulting the Loom...</p>
            </div>
          </motion.div>
        ) : aiResult ? (
          <motion.div 
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
          >
            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-3xl text-center relative overflow-hidden">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-fuchsia-500/10 blur-[50px] -translate-y-16" />
               <Sparkles className="mx-auto mb-4 text-fuchsia-400" size={32} />
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-lavender-400 mb-2">{aiResult.vibe}</p>
               <h4 className="font-serif text-2xl text-white italic mb-4 leading-tight">"{aiResult.description}"</h4>
               
               {aiResult.match ? (
                  <div className="mt-8 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Aligned Wardrobe Artifact</p>
                    <div className="flex items-center gap-6 bg-white/5 p-4 pr-8 rounded-[2rem] border border-lavender-500/20 shadow-xl group hover:border-lavender-500 transition-all cursor-pointer">
                        <div className="w-20 h-24 rounded-2xl overflow-hidden shadow-lg">
                           <img 
                             src={aiResult.match.imageUrl} 
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                             referrerPolicy="no-referrer"
                             onError={(e) => {
                               e.currentTarget.src = 'https://images.unsplash.com/photo-1594932224011-042041c65451?auto=format&fit=crop&q=80&w=400';
                             }}
                           />
                        </div>
                        <div className="text-left">
                            <p className="font-serif text-xl text-white italic">{aiResult.match.name}</p>
                            <p className="text-[9px] uppercase font-black tracking-[0.2em] text-fuchsia-400 mt-1">{aiResult.match.category}</p>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 py-4 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-widest">No matching threads in your loom.</p>
                  </div>
                )}
            </div>

            <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 px-2 mb-4">
                    <div className="flex items-center gap-2">
                       <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-white/40">Marketplace Echoes</h4>
                       <Search size={14} className="text-white/20" />
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <input 
                         type="number" 
                         placeholder="Max Price..." 
                         value={maxPrice} 
                         onChange={(e) => setMaxPrice(e.target.value)}
                         className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-fuchsia-500 w-28"
                       />
                       <select 
                         value={sortOrder} 
                         onChange={(e) => setSortOrder(e.target.value as any)}
                         className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-fuchsia-500 appearance-none drop-shadow-md"
                       >
                         <option value="default" className="bg-[#1a0b2e] text-white">Default</option>
                         <option value="asc" className="bg-[#1a0b2e] text-white">Price: Low to High</option>
                         <option value="desc" className="bg-[#1a0b2e] text-white">Price: High to Low</option>
                       </select>
                    </div>
                </div>
                
                <div className="overflow-x-auto pb-8">
                    <table className="w-full text-left text-[11px] text-white/70 border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest bg-white/5">
                          <th className="p-3 whitespace-nowrap">Store</th>
                          <th className="p-3">Item Details</th>
                          <th className="p-3 whitespace-nowrap">Price</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedSuggestions.map((item: any, i: number) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-3 font-bold text-fuchsia-300 uppercase tracking-widest">{item.store}</td>
                            <td className="p-3 font-medium text-white">{item.name}</td>
                            <td className="p-3 text-emerald-400 font-bold">{item.price}</td>
                            <td className="p-3 flex justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onAddItem?.({
                                      name: item.name,
                                      category: 'Top',
                                      imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b830c6050?auto=format&fit=crop&q=80&w=400',
                                      weatherTags: ['Sunny']
                                    });
                                  }}
                                  className="p-1.5 bg-white/10 rounded border border-white/10 hover:bg-white/20 transition-colors"
                                  title="Add to Closet"
                                >
                                    <Plus size={12} className="text-white" />
                                </button>
                                <a 
                                  href={item.shopLink || `https://www.google.com/search?q=${encodeURIComponent('buy ' + (item.name || '') + ' ' + (item.store || ''))}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-white/10 rounded border border-white/10 hover:bg-fuchsia-500 transition-colors block"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink size={12} className="text-white" />
                                </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
