import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles, Wand2, Plus, X, ExternalLink, ShoppingBag, Github } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { UserData } from '../types';

const TREND_PREFERENCES = [
  'Aesthetic', 'Pinteresty', 'Halter neck', 'Boat neck',
  'Dresses', 'Party wear', 'Y2K', 'Minimalist', 'Cozy',
  'Streetwear', 'Vintage', 'Dark Academia', 'Fairycore',
  'Boho', 'Chic', 'Edgy'
];

export function TrendsView({ data, setData }: { data: UserData; setData: React.Dispatch<React.SetStateAction<UserData>> }) {
  const [preferences, setPreferences] = useState<string[]>(data.preferences || []);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customPref, setCustomPref] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (data.preferences && data.preferences.length > 0 && !analysis && !loading && !isEditing) {
      generateTrends(data.preferences);
    }
  }, [data.preferences]);

  const togglePref = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPref.trim() && !preferences.includes(customPref.trim())) {
      setPreferences(prev => [...prev, customPref.trim()]);
    }
    setCustomPref('');
  };

  const saveAndAnalyze = () => {
    setData(prev => ({ ...prev, preferences }));
    setIsEditing(false);
    generateTrends(preferences);
  };

  const generateTrends = async (prefs: string[]) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const favCategories = Array.from(new Set(data.items.map(i => i.category))).join(', ');
      
      const prompt = `
        You are the Eternal Style Oracle of the Memory Loom.
        Analyze global fashion archives and future trends.
        User Aesthetic Profile: ${prefs.join(', ')}
        Their Closet: ${data.items.length} pieces in categories: ${favCategories}.

        Provide a "Vision of the Tides":
        1. "The Current Drift": 1-2 trends happening NOW.
        2. "The Loom's Suggestion": How to style existing items.
        3. "Marketplace Echoes": 30 specific, high-quality shopping artifacts without fetching image URLs.
        
        CRITICAL FOR LINKS:
        - Provide actual official retail site names (Zara, H&M, Nordstrom, etc.).
        - Ensure product names are distinct and accurate (e.g., "ASOS DESIGN high waist tailored trouser").
        - Generate a highly probable direct search URL for the retailer (e.g. "https://www.zara.com/search?searchTerm=item+name") in the shopLink field.

        Return ONLY a JSON object:
        {
          "visionHtml": "...",
          "shoppingSuggestions": [
            {
              "name": "Exact Product Name",
              "store": "Retailer Name",
              "price": "₹...",
              "shopLink": "Direct generated search URL for this store"
            }
          ]
        }
      `;

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      const text = response.text || '{}';
      const cleanJsonMatch = text.match(/\{[\s\S]*\}/);
      const cleanJson = cleanJsonMatch ? cleanJsonMatch[0] : '{}';
      const res = JSON.parse(cleanJson);
      setAnalysis(res.visionHtml || '');
      setShoppingSuggestions(res.shoppingSuggestions || []);
    } catch(e) {
       console.error(e);
       setAnalysis("<p>The oracle's vision is clouded. The threads are tangled.</p>");
    } finally {
      setLoading(false);
    }
  };

  const [shoppingSuggestions, setShoppingSuggestions] = useState<any[]>([]);

  const extractPrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const match = priceStr.replace(/,/g, '').match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  };

  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const processedSuggestions = useMemo(() => {
    let filtered = [...shoppingSuggestions];
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
  }, [shoppingSuggestions, sortOrder, maxPrice]);

  if (!data.preferences || data.preferences.length === 0 || isEditing) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className="flex justify-between items-end mb-4 px-2">
            <div>
              <h3 className="font-serif text-3xl font-black text-white drop-shadow-md italic">The Oracle</h3>
              <p className="text-[10px] text-white uppercase tracking-widest font-black mt-1">Channel Your Aesthetic Frequency</p>
            </div>
        </div>

        <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          
          <p className="text-white text-sm font-medium mb-8 leading-relaxed opacity-80">Select the signals that resonate with your fashion soul. Our digital scryer will weave these into a unique style vision.</p>

          <div className="flex flex-wrap gap-2.5 mb-8">
            {TREND_PREFERENCES.map(pref => {
              const isSelected = preferences.includes(pref);
              return (
                <button
                  key={pref}
                  onClick={() => togglePref(pref)}
                  className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 border ${
                    isSelected 
                      ? 'bg-gradient-to-r from-fuchsia-600 to-lavender-600 text-white border-white/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                      : 'bg-white/5 text-white/70 border-white/5 hover:border-fuchsia-500/30 hover:text-white'
                  }`}
                >
                  {pref}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleAddCustom} className="flex gap-2 mb-8 relative z-10">
            <input 
              type="text" 
              value={customPref}
              onChange={(e) => setCustomPref(e.target.value)}
              placeholder="Add personal essence..."
              className="flex-1 bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-400 placeholder:text-white/20 transition-all font-bold"
            />
            <button type="submit" disabled={!customPref.trim()} className="bg-white/5 text-fuchsia-400 border border-white/10 p-4 rounded-2xl hover:bg-fuchsia-500 hover:text-white transition-all disabled:opacity-50">
              <Plus size={20} />
            </button>
          </form>

          <button 
            onClick={saveAndAnalyze}
            disabled={preferences.length === 0}
            className="w-full bg-gradient-to-r from-fuchsia-600 via-lavender-600 to-purple-700 font-black uppercase tracking-[0.4em] text-[10px] text-white py-5 flex items-center justify-center gap-3 rounded-[2rem] disabled:opacity-20 hover:scale-[1.02] active:scale-95 shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all relative z-10"
          >
            <Sparkles size={20} /> Ignite Resonance
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
      <div className="flex justify-between items-end mb-4 px-2">
          <div>
            <h3 className="font-serif text-3xl font-black text-white drop-shadow-md italic">The Oracle</h3>
            <p className="text-[10px] text-white uppercase tracking-widest font-black mt-1">Visions of the Memory Loom</p>
          </div>
          <div className="flex gap-2">
            <a 
              href="https://github.com/google/ai-studio-build" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[9px] font-black uppercase tracking-widest text-white/70 hover:text-white bg-white/5 p-3 rounded-2xl transition-all backdrop-blur-md border border-white/5 flex items-center gap-2"
            >
              <Github size={12} />
              google/ai-studio-build
            </a>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-[9px] font-black uppercase tracking-widest text-white/70 hover:text-white bg-white/5 p-3 rounded-2xl transition-all backdrop-blur-md border border-white/5"
            >
              Adjust Signals
            </button>
          </div>
      </div>

      <div className="bg-white/5 p-8 pt-10 rounded-[3rem] border border-white/5 shadow-3xl relative overflow-hidden glass-card backdrop-blur-3xl min-h-[40vh]">
        <div className="absolute top-0 right-0 w-full h-40 bg-gradient-to-b from-fuchsia-500/5 to-transparent pointer-events-none" />
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-8 relative overflow-hidden rounded-[3rem] bg-black/20">
            <motion.div
              className="absolute inset-0 z-0"
              animate={{
                background: [
                  'radial-gradient(circle at 30% 30%, rgba(168,85,247,0.3) 0%, transparent 70%)',
                  'radial-gradient(circle at 70% 70%, rgba(217,70,239,0.3) 0%, transparent 70%)',
                  'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.4) 0%, transparent 70%)',
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <motion.div
              className="relative z-10"
              animate={{ 
                rotateY: [0, 180, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 blur-3xl bg-fuchsia-500 rounded-full opacity-40 animate-pulse" />
              <Compass size={64} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
            </motion.div>

            <div className="text-center relative z-10 space-y-2">
              <h4 className="text-2xl font-serif italic text-white font-black tracking-wide">Consulting the Archives</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-fuchsia-400 animate-pulse">Woven Threads Aligning...</p>
            </div>
            
            <div className="flex gap-2 relative z-10">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white"
                  animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="prose prose-invert prose-p:text-white prose-headings:text-white prose-headings:font-serif prose-headings:italic prose-strong:text-white prose-strong:font-black max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: analysis || '' }} 
          />
        )}

        {!loading && shoppingSuggestions.length > 0 && (
          <div className="mt-12 space-y-4">
             <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
               <div className="flex items-center gap-2">
                 <ShoppingBag size={14} className="text-fuchsia-400" />
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Marketplace Artifacts</p>
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
             <div className="overflow-x-auto pb-12">
               <table className="w-full text-left text-[11px] text-white/70 border-collapse">
                 <thead>
                   <tr className="border-b border-white/10 text-white/50 uppercase tracking-widest bg-white/5">
                     <th className="p-3 whitespace-nowrap">Store</th>
                     <th className="p-3">Item Name</th>
                     <th className="p-3 whitespace-nowrap">Price</th>
                     <th className="p-3 text-right">Search</th>
                   </tr>
                 </thead>
                 <tbody>
                   {processedSuggestions.map((item, idx) => (
                     <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                       <td className="p-3 font-bold text-fuchsia-300 uppercase tracking-widest">{item.store}</td>
                       <td className="p-3 font-medium text-white">{item.name}</td>
                       <td className="p-3 text-emerald-400 font-bold">{item.price}</td>
                       <td className="p-3 text-right">
                         <a 
                           href={item.shopLink || `https://www.google.com/search?tbm=shop&q=${encodeURIComponent((item.name || '') + ' ' + (item.store || ''))}`}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="inline-block bg-white/10 p-1.5 rounded-lg border border-white/10 hover:bg-fuchsia-500 hover:border-fuchsia-400 transition-all shadow-lg"
                           onClick={(e) => e.stopPropagation()}
                         >
                           <ExternalLink size={10} className="text-white" />
                         </a>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
        
        <div className="absolute bottom-4 right-4 opacity-10">
           <Sparkles size={40} className="text-white" />
        </div>
      </div>
      
      {!loading && (
        <button 
          onClick={() => generateTrends(preferences)}
          className="w-full flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 hover:text-fuchsia-400 py-6 transition-all"
        >
          <Wand2 size={16} /> Seek New Prophecy
        </button>
      )}
    </motion.div>
  );
}
