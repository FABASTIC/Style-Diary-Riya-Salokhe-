import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Shirt, 
  Palette, 
  Plus, 
  Trash2, 
  CloudSun, 
  CloudRain, 
  Snowflake, 
  Leaf, 
  Sun,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BarChart2,
  Edit2,
  X,
  Upload,
  Check,
  BookHeart,
  Camera,
  Compass,
  Wand2,
  Radar as RadarIcon,
  ShoppingBag,
  Heart
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO,
  subDays,
  differenceInDays
} from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";

import { Category, Weather, ClothingItem, Outfit, LogEntry, UserData, INITIAL_DATA } from './types';
import animeWow from './assets/images/anime_wow_1776756124733.png';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants & Config ---
const STORAGE_KEY = 'style_diary_data';
const CATEGORIES: Category[] = ['Top', 'Bottom', 'Shoes', 'Outerwear', 'Accessory'];
const CATEGORY_COVERS: Record<string, string> = {
  'All': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=400', // Represents a collection/flatlay of clothes
  'Top': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400',
  'Bottom': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=400', // Blue denim cover (FIXED)
  'Shoes': 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=400',
  'Outerwear': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=400', // Black jacket
  'Accessory': 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&q=80&w=400'
};
const WEATHER_COVERS: Record<string, string> = {
  'All': 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?auto=format&fit=crop&q=80&w=400',
  'Sunny': 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&q=80&w=400',
  'Rainy': 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=400',
  'Cold': 'https://images.unsplash.com/photo-1445543949571-ffc3e0e2f55e?auto=format&fit=crop&q=80&w=400',
  'Autumn': 'https://images.unsplash.com/photo-1507371341162-763b5e419408?auto=format&fit=crop&q=80&w=400',
  'Spring': 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=400',
};
const WEATHERS: { type: Weather; icon: any; label: string }[] = [
  { type: 'Sunny', icon: Sun, label: 'Sunny' },
  { type: 'Rainy', icon: CloudRain, label: 'Rainy' },
  { type: 'Cold', icon: Snowflake, label: 'Cold' },
  { type: 'Autumn', icon: Leaf, label: 'Autumn' },
  { type: 'Spring', icon: CloudSun, label: 'Spring' },
];

// --- Mock Data Initialization (if storage empty) ---
const setupInitialWardrobe = (data: UserData): UserData => {
  if (data.items.length > 0) return data;
  return {
    ...data,
    items: [
      { id: '1', name: 'Casual Shirt', category: 'Top', imageUrl: 'https://images.unsplash.com/photo-1626497764746-6dc36546b388?auto=format&fit=crop&w=400&q=80', weatherTags: ['Sunny', 'Spring'] },
      { id: '2', name: 'Denim Jeans', category: 'Bottom', imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=400', weatherTags: ['Autumn', 'Spring', 'Cold'] },
      { id: '3', name: 'Trench Coat', category: 'Outerwear', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80', weatherTags: ['Rainy', 'Autumn', 'Cold'] },
      { id: '4', name: 'Classic Sneakers', category: 'Shoes', imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80', weatherTags: ['Sunny', 'Spring', 'Autumn'] },
      { id: '5', name: 'Design Kurta', category: 'Top', imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=400&q=80', weatherTags: ['Sunny', 'Spring'] }
    ]
  };
};

// Force Update 3.0
import { AuthScreen } from './components/AuthScreen';
import { DrawingBoard } from './components/DrawingBoard';
import { TrendsView } from './components/TrendsView';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { getLocalWeather, WeatherData as LocalWeather } from './lib/weather';
import { useFirebaseSync } from './lib/useFirebaseSync';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Use our sync hook!
  const [data, setData] = useFirebaseSync(user, setupInitialWardrobe(INITIAL_DATA));
  
  const [activeTab, setActiveTab] = useState<string>('journal');
  const [initialOutfitToEdit, setInitialOutfitToEdit] = useState<Outfit | null>(null);

  const handleEditOutfitRequest = (outfit: Outfit) => {
    setInitialOutfitToEdit(outfit);
    setActiveTab('studio');
  };
  const [showSplash, setShowSplash] = useState(true);
  const [localWeather, setLocalWeather] = useState<LocalWeather | null>(null);

  useEffect(() => {
    document.title = "Style Diary";
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Hydrate local weather
        getLocalWeather().then(w => setLocalWeather(w)).catch(e => console.warn("Weather error:", e));
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Hydrate Data... for now keeping local data logic but wrapped in user check
  const varietyScore = 65; 

  return (
    <div className="flex flex-col min-h-screen text-slate-100 font-sans selection:bg-fuchsia-500/30">
      <AnimatePresence mode="wait">
        {(loading || showSplash) ? (
          <SplashScreen key="splash" />
        ) : !user ? (
          <AuthScreen key="auth" onSignedUp={() => {}} />
        ) : (
          <motion.div 
            key="app-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-screen max-w-md mx-auto bg-[#0f0c29] shadow-2xl relative pb-20 overflow-hidden w-full"
          >
            <Header data={data} setData={setData} score={varietyScore} user={user} localWeather={localWeather} />
            
            <main className="flex-1 overflow-y-auto px-4 py-6">
              <AnimatePresence mode="wait">
                {activeTab === 'journal' && <JournalView key="journal" data={data} setData={setData} />}
                {activeTab === 'wardrobe' && <WardrobeView key="wardrobe" data={data} setData={setData} onEditOutfit={handleEditOutfitRequest} />}
                {activeTab === 'studio' && (
                  <StudioView 
                    key="studio" 
                    data={data} 
                    setData={setData} 
                    initialOutfit={initialOutfitToEdit} 
                    onClearInitial={() => setInitialOutfitToEdit(null)} 
                  />
                )}
                {activeTab === 'alchemy' && (
                  <DrawingBoard 
                    key="alchemy" 
                    userItems={data.items} 
                    onAddItem={(item) => {
                      setData(prev => ({
                        ...prev,
                        items: [{ ...item, id: Math.random().toString(36).substr(2, 9) }, ...prev.items]
                      }));
                      setActiveTab('wardrobe');
                    }}
                  />
                )}
                {activeTab === 'stats' && <StatsView data={data} setData={setData} score={varietyScore} user={user} onEditOutfit={handleEditOutfitRequest} />}
                {activeTab === 'trends' && <TrendsView data={data} setData={setData} />}
              </AnimatePresence>
            </main>

            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Components ---

function SplashScreen() {
  return (
    <motion.div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a0b2e 0%, #0a0410 100%)' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background Animated Swirls & Shine */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full mix-blend-screen overflow-hidden"
            style={{
              width: Math.random() * 400 + 200,
              height: Math.random() * 400 + 200,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(168,85,247,0.1)' : 'rgba(217,70,239,0.1)'} 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Shimmering Stars/Motes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`mote-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0],
              y: [0, -100],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}

        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        />

        {/* Dynamic Sparkles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute text-white/40"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${15 + Math.random() * 70}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              rotate: [0, 90, 180],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          >
            <Sparkles size={16 + Math.random() * 20} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center relative z-10"
      >
        <div className="relative group">
          <motion.div
            className="absolute -inset-8 bg-gradient-to-r from-fuchsia-500/30 to-lavender-500/30 rounded-[4rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"
            animate={{ 
              rotate: [0, 180, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          />
          <div className="w-48 h-48 mb-6 mx-auto bg-white/10 glass-card rounded-[2.5rem] flex items-center justify-center shadow-2xl p-2 relative overflow-hidden backdrop-blur-3xl border border-white/20">
            <BookHeart className="absolute w-32 h-32 text-lavender-500/20" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none z-20"
              animate={{ 
                x: ['-200%', '200%'],
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", repeatDelay: 1 }}
            />
            <div className="relative z-10 w-full h-full rounded-[2rem] overflow-hidden bg-white flex items-center justify-center">
              <img 
                src="https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/1b/ff/82/1bff82fc-c7ce-c95c-1fcb-2fdaff76d5a1/AppIcon-0-0-1x_U007epad-0-1-85-220.png/1200x630wa.jpg" 
                alt="Style Diary Logo" 
                className="w-full h-full object-cover scale-125" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-500/10 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-serif font-black text-white tracking-tighter mb-2 italic drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
          Style Diary
        </h1>
        <p className="text-lavender-400 font-bold tracking-[0.3em] uppercase text-[10px]">
          Identity • Threads • Archive
        </p>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-12 flex gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="w-2 h-2 rounded-full bg-lavender-500 animate-bounce" />
        <div className="w-2 h-2 rounded-full bg-lavender-500 animate-bounce delay-100" />
        <div className="w-2 h-2 rounded-full bg-lavender-500 animate-bounce delay-200" />
      </motion.div>
    </motion.div>
  );
}

function Header({ data, setData, score, user, localWeather }: { data: UserData; setData: React.Dispatch<React.SetStateAction<UserData>>; score: number; user: any; localWeather: LocalWeather | null }) {
  const firstName = user?.displayName?.split(' ')[0] || 'ORACLE';

  return (
    <header className="px-5 pt-8 pb-4 flex items-start justify-between bg-lavender-50/10 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-white/20 shadow-lg backdrop-blur-md overflow-hidden">
           <img 
             src="https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/1b/ff/82/1bff82fc-c7ce-c95c-1fcb-2fdaff76d5a1/AppIcon-0-0-1x_U007epad-0-1-85-220.png/1200x630wa.jpg" 
             className="w-full h-full object-cover scale-110" 
             alt="Logo" 
             referrerPolicy="no-referrer"
           />
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-2xl font-serif font-black text-white uppercase tracking-widest leading-none drop-shadow-md">
            {firstName}
          </h2>
          <div className="flex items-center gap-1.5 text-lavender-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="text-xs font-medium tracking-wide">
              {localWeather?.locationName || 'Locating...'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex bg-white/5 p-1 rounded-2xl items-center gap-2 border border-white/10 shadow-lg backdrop-blur-md cursor-pointer hover:bg-white/10 hover:border-fuchsia-500/50 transition-all mt-1">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-lavender-500/20 flex items-center justify-center text-fuchsia-400">
          {localWeather?.condition === 'Rainy' ? <CloudRain size={20} /> :
           localWeather?.condition === 'Sunny' ? <Sun size={20} /> :
           <CloudSun size={20} />}
        </div>
        <div className="flex flex-col pr-3">
          <span className="text-base font-black text-white leading-none">
            {localWeather ? `${localWeather.temp}°` : '--°'}
          </span>
          <span className="text-[7px] font-black uppercase tracking-widest text-white">
            {localWeather?.condition || 'Unknown'}
          </span>
        </div>
      </div>
    </header>
  );
}

function Navigation({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: any) => void }) {
  const tabs = [
    { id: 'journal', icon: CalendarIcon, label: 'Memories' },
    { id: 'wardrobe', icon: Shirt, label: 'Closet' },
    { id: 'studio', icon: Palette, label: 'Builder' },
    { id: 'alchemy', icon: Sparkles, label: 'Forge' },
    { id: 'trends', icon: Compass, label: 'Oracle' },
    { id: 'stats', icon: BarChart2, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#18092a]/90 backdrop-blur-2xl px-2 py-2 rounded-[2rem] border border-lavender-400/20 shadow-[0_10px_50px_rgba(0,0,0,0.6)] z-40 flex items-center gap-0.5">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2.5 rounded-full transition-all duration-300",
            activeTab === tab.id ? "bg-gradient-to-r from-fuchsia-600 to-lavender-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/20" : "text-lavender-300/40 hover:text-fuchsia-300 hover:bg-white/5"
          )}
        >
          <tab.icon size={16} />
          {activeTab === tab.id && <span className="text-[9px] font-black uppercase tracking-tight">{tab.label}</span>}
        </button>
      ))}
    </nav>
  );
}

// --- Tab Views ---

function JournalView({ data, setData }: { data: UserData; setData: React.Dispatch<React.SetStateAction<UserData>>; key?: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showLogModal, setShowLogModal] = useState(false);
  const [logModalSelectedItems, setLogModalSelectedItems] = useState<string[]>([]);
  const [isLoggingItems, setIsLoggingItems] = useState(false);
  const [repetitionAlert, setRepetitionAlert] = useState<{ date: string; outfit: string } | null>(null);
  const [showWowOverlay, setShowWowOverlay] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const scheduleStart = startOfWeek(monthStart);
  const scheduleEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: scheduleStart, end: scheduleEnd });

  const handleLogMultipleItems = async () => {
    if (logModalSelectedItems.length === 0) return;
    
    const sortedSelected = [...logModalSelectedItems].sort().join(',');
    const existing = data.outfits.find(o => [...o.itemIds].sort().join(',') === sortedSelected);
    
    if (existing) {
      handleLogOutfit(existing.id);
      setLogModalSelectedItems([]);
      return;
    }

    if (logModalSelectedItems.length === 1) {
       const itemName = data.items.find(i => i.id === logModalSelectedItems[0])?.name || "Item Look";
       handleCreateAndLogOutfit({ name: itemName, itemIds: logModalSelectedItems });
       setLogModalSelectedItems([]);
       return;
    }

    setIsLoggingItems(true);
    try {
      const selectedItemNames = logModalSelectedItems.map(id => data.items.find(i=>i.id===id)?.name).filter(Boolean);
      const prompt = `As a personal stylist, give a catchy, short, and fashionable fantasy name (max 4 words) for an outfit consisting of these items: ${selectedItemNames.join(', ')}. Return ONLY the name, nothing else.`;
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });
      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview", 
        contents: prompt
      });
      const generatedName = response.text?.trim() || "New Outfit";
      handleCreateAndLogOutfit({ name: generatedName.replace(/["*]/g, ''), itemIds: logModalSelectedItems });
    } catch (err) {
      console.error(err);
      handleCreateAndLogOutfit({ name: "My New Look", itemIds: logModalSelectedItems });
    } finally {
      setIsLoggingItems(false);
      setLogModalSelectedItems([]);
    }
  };

  const getLogForDay = (date: Date) => {
    return data.logs.find(log => log.date === format(date, 'yyyy-MM-dd'));
  };

  const handleLogOutfit = (outfitId: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const currentOutfit = data.outfits.find(o => o.id === outfitId);
    
    // Repetition Penalty Check (checking item combinations for outfits with >1 item)
    if (currentOutfit && currentOutfit.itemIds.length > 1) {
      const currentItems = [...currentOutfit.itemIds].sort().join(',');
      
      const recentLogs = data.logs.filter(log => {
        const logOutfit = data.outfits.find(o => o.id === log.outfitId);
        if (!logOutfit || logOutfit.itemIds.length <= 1) return false;
        
        const logItems = [...logOutfit.itemIds].sort().join(',');
        const isSameCombination = currentItems === logItems;
        
        const logDate = parseISO(log.date);
        const diff = Math.abs(differenceInDays(selectedDate, logDate));
        return diff >= 0 && diff <= 7 && isSameCombination;
      });

      if (recentLogs.length > 0) {
        setRepetitionAlert({ date: recentLogs[0].date, outfit: currentOutfit.name });
        return; // Stop if duplicate combination
      }
    }

    // Success state
    if (currentOutfit) {
      setShowWowOverlay(true);
      setTimeout(() => setShowWowOverlay(false), 2500);
    }

    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: dateStr,
      outfitId
    };

    setData(prev => ({
      ...prev,
      logs: [...prev.logs, newLog]
    }));
    setShowLogModal(false);
  };

  const handleCreateAndLogOutfit = (newOutfitData: Omit<Outfit, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const outfit: Outfit = { id, ...newOutfitData };
    setData(prev => ({
      ...prev,
      outfits: [outfit, ...prev.outfits]
    }));
    handleLogOutfit(id);
  };

  const handleUnlogOutfit = (logId: string) => {
    setData(prev => ({
      ...prev,
      logs: prev.logs.filter(l => l.id !== logId)
    }));
  };

  const selectedLogs = data.logs.filter(l => l.date === format(selectedDate, 'yyyy-MM-dd'));
  const selectedOutfits = selectedLogs.map(log => ({
    logId: log.id,
    outfit: data.outfits.find(o => o.id === log.outfitId)
  })).filter(entry => entry.outfit);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <section className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-2xl text-white">Calendar</h3>
          <div className="flex items-center bg-white/5 rounded-full shadow-inner p-1 border border-white/5">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 text-white/30 hover:text-lavender-400 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="px-3 text-xs font-bold text-white min-w-[100px] text-center uppercase tracking-widest">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 text-white/30 hover:text-lavender-400 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 bg-white/5 p-4 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div key={`${day}-${i}`} className="text-center text-[8px] font-black text-fuchsia-300/30 py-1 uppercase tracking-[0.2em]">{day[0]}</div>
          ))}
          {days.map((day, i) => {
            const log = getLogForDay(day);
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const isMonth = isSameMonth(day, monthStart);
            
            return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "aspect-square relative flex items-center justify-center rounded-2xl text-[10px] font-black transition-all border-2",
                      !isMonth && "opacity-5 pointer-events-none",
                      isMonth && isToday && !isSelected && "text-lavender-300 bg-lavender-500/10 border-lavender-400/40 shadow-xl",
                      isMonth && !isToday && !isSelected && "text-white/40 bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 shadow-sm",
                      isSelected && "bg-gradient-to-br from-fuchsia-600 via-lavender-600 to-purple-700 text-white border-white/60 shadow-[0_0_40px_rgba(168,85,247,0.6)] scale-110 z-10",
                      !isSelected && log && "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/40 shadow-[inset_0_0_15px_rgba(168,85,247,0.2)]",
                      !isSelected && isMonth && "hover:border-lavender-400/50 hover:scale-105 active:scale-95"
                    )}
                  >
                {format(day, 'd')}
                {log && !isSelected && (
                  <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(192,38,211,1)]" />
                )}
                {isToday && !isSelected && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily Preview */}
      <section className="bg-white/5 glass-card rounded-3xl p-6 shadow-2xl border border-white/5">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="font-serif font-bold text-white text-lg leading-tight">{format(selectedDate, 'EEEE')}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">{format(selectedDate, 'do MMMM')}</p>
          </div>
          <button 
            onClick={() => setShowLogModal(true)}
            className="bg-lavender-500 text-white p-3 rounded-2xl shadow-xl shadow-lavender-500/20 hover:scale-105 transition-all"
          >
            <Plus size={20} />
          </button>
        </div>

        {selectedOutfits.length > 0 ? (
          <div className="space-y-8">
            {selectedOutfits.map(({ logId, outfit }) => (
              <div key={logId} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                  {outfit!.itemIds.map(itemId => {
                    const item = data.items.find(i => i.id === itemId);
                    if (!item) return null;
                    return (
                      <div key={item.id} className="min-w-[80px] text-center">
                        <img 
                          src={item.imageUrl} 
                          className="w-20 h-24 object-cover rounded-xl shadow-sm mb-2" 
                          referrerPolicy="no-referrer" 
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1594932224011-042041c65451?auto=format&fit=crop&q=80&w=400';
                          }}
                        />
                        <p className="text-[10px] font-bold text-white/60 truncate px-1">{item.name}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between group/outfit hover:border-lavender-500/30 transition-all">
                  <div>
                    <span className="text-[10px] font-black text-lavender-400 uppercase tracking-widest block mb-1">Logged Look</span>
                    <p className="font-serif text-xl italic text-white leading-tight">{outfit!.name}</p>
                  </div>
                  <button 
                    onClick={() => handleUnlogOutfit(logId)}
                    className="p-3 text-white/10 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Remove this log"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
            <Sparkles className="mx-auto mb-2 text-white/10" size={32} />
            <p className="text-sm text-white/20">No memories recorded yet.</p>
          </div>
        )}
      </section>

      {/* Gemini AI Trigger */}
      <AiSuggestionPanel data={data} onUseOutfit={handleLogOutfit} onCreateAndUseOutfit={handleCreateAndLogOutfit} />

      {/* Modals & Alerts */}
      <AnimatePresence>
        {showWowOverlay && (
          <motion.div
            key="wow-overlay"
            initial={{ scale: 0, opacity: 0, y: 150, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, y: 100, rotate: 10 }}
            transition={{ type: "spring", bounce: 0.7, duration: 1 }}
            className="fixed bottom-[10%] right-[10%] z-50 pointer-events-none"
          >
            <div className="relative">
              <motion.div 
                animate={{ y: [0, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <div className="bg-white/90 backdrop-blur-sm text-lavender-500 font-bold px-4 py-2 rounded-2xl shadow-xl absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap border-2 border-lavender-200">
                  Wow! Perfect Outfit! ✨
                </div>
                <img src={animeWow} alt="Wow" className="w-56 h-auto drop-shadow-[0_0_20px_rgba(255,105,180,0.5)] z-50 pointer-events-none" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {repetitionAlert && (
          <motion.div 
            key="rep-alert"
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              x: ['-50%', '-52%', '-48%', '-52%', '-48%', '-50%'],
              borderColor: ['#e11d48', '#fb7185', '#e11d48'],
            }}
            transition={{ 
              x: { duration: 0.5, ease: "easeInOut", times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
              borderColor: { repeat: Infinity, duration: 0.8, ease: "easeInOut" }
            }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[60] bg-black/80 text-rose-200 px-8 py-6 rounded-[2rem] border-4 flex flex-col items-center gap-3 backdrop-blur-2xl text-center min-w-[300px] shadow-[0_0_50px_rgba(225,29,72,0.6)]"
          >
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="bg-rose-600 p-3 rounded-full shadow-[0_0_30px_rgba(225,29,72,1)]"
            >
              <AlertCircle className="text-white" size={32} />
            </motion.div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.4em] text-rose-500 mb-2">Repetition Penalty</p>
              <p className="text-lg font-black text-white leading-tight">
                CRITICAL WARNING:<br/>
                <span className="text-rose-400 italic">"{repetitionAlert.outfit}"</span><br/>
                was already woven into history on {repetitionAlert.date}!
              </p>
            </div>
            <button 
              onClick={() => setRepetitionAlert(null)}
              className="mt-4 px-8 py-3 bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-full shadow-lg hover:bg-rose-500"
            >
              Acknowledge Lapse
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLogModal && (
          <motion.div 
            key="log-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="w-full max-w-sm bg-[#0f0c29]/90 border border-white/10 rounded-[3rem] p-10 shadow-3xl relative backdrop-blur-2xl"
            >
              <button onClick={() => setShowLogModal(false)} className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors">
                <X size={28} />
              </button>
              <h3 className="font-serif text-3xl mb-6 italic text-lavender-400">Select Look</h3>
              
              <div className="max-h-[50vh] overflow-y-auto space-y-6 pr-2 scrollbar-none">
                <div>
                  <h4 className="text-[10px] font-black tracking-widest uppercase text-white/50 mb-3">Studio Silhouettes</h4>
                  {data.outfits.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-sm font-bold text-white/20 uppercase tracking-widest leading-relaxed px-6">Your studio is empty.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.outfits.map(outfit => (
                        <button
                          key={outfit.id}
                          onClick={() => handleLogOutfit(outfit.id)}
                          className="w-full text-left p-5 rounded-[2rem] bg-white/5 hover:bg-white/10 transition-all border border-white/5 group flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-white mb-0.5 tracking-tight">{outfit.name}</p>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{outfit.itemIds.length} Pieces</p>
                          </div>
                          <div className="bg-lavender-500/10 p-2 rounded-xl group-hover:bg-lavender-500 transition-colors">
                            <ChevronRight size={16} className="text-lavender-400 group-hover:text-white" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-[10px] font-black tracking-widest uppercase text-white/50 mb-3 mt-4 flex justify-between items-center">
                    <span>Or Build New Look ({logModalSelectedItems.length} selected)</span>
                    {logModalSelectedItems.length > 0 && (
                        <button 
                          onClick={handleLogMultipleItems}
                          disabled={isLoggingItems}
                          className="bg-lavender-500 hover:bg-lavender-400 text-white px-3 py-1 rounded-full whitespace-nowrap disabled:opacity-50 transition-colors"
                        >
                          {isLoggingItems ? 'Naming...' : 'Log Selection'}
                        </button>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pb-8">
                    {data.items.map((item) => {
                      const isSelected = logModalSelectedItems.includes(item.id);
                      return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setLogModalSelectedItems(prev => 
                            isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id]
                          );
                        }}
                        className={`border rounded-2xl p-3 flex items-center gap-3 transition-colors text-left ${isSelected ? 'bg-lavender-500/20 border-lavender-400' : 'bg-white/5 hover:bg-white/10 border-white/5'}`}
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative">
                          <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
                          {isSelected && <div className="absolute inset-0 bg-lavender-500/30"></div>}
                        </div>
                        <div className="truncate">
                          <p className="text-[10px] font-bold text-white truncate">{item.name}</p>
                          <p className="text-[8px] text-white/40 uppercase font-black">{item.category}</p>
                        </div>
                      </button>
                    )})}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlidingFilter({ children, className }: { children: React.ReactNode; className?: string; speed?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const startDragging = (e: React.MouseEvent) => {
    setIsMouseDown(true);
    if (!scrollRef.current) return;
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const stopDragging = () => {
    setIsMouseDown(false);
    if (scrollRef.current) {
      scrollRef.current.style.scrollBehavior = 'smooth';
    }
  };

  const onDrag = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
    scrollRef.current.style.scrollBehavior = 'auto';
  };

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div 
        ref={scrollRef}
        onMouseDown={startDragging}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onMouseMove={onDrag}
        className={cn(
          "flex gap-3 py-2 px-4 overflow-x-auto scrollbar-none will-change-scroll overscroll-x-contain [-webkit-overflow-scrolling:touch] scroll-smooth",
          isMouseDown ? "cursor-grabbing snap-none" : "cursor-grab snap-x snap-mandatory"
        )}
      >
        {children}
      </div>
      
      {/* Edge Gradients for smooth fade */}
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0f0c29] to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0f0c29] to-transparent pointer-events-none" />
    </div>
  );
}

function WardrobeView({ data, setData, onEditOutfit }: { data: UserData; setData: React.Dispatch<React.SetStateAction<UserData>>; onEditOutfit: (o: Outfit) => void; key?: string }) {
  const [activeCategory, setActiveCategory] = useState<Category | 'All' | 'Saved Outfits'>('All');
  const [activeWeather, setActiveWeather] = useState<Weather | 'All'>('All');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ClothingItem>>({ category: 'Top', weatherTags: ['Sunny'] });
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Camera access denied or unavailable.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      compressAndSetImage(canvas.toDataURL('image/jpeg', 0.9));
      stopCamera();
    }
  };

  const compressAndSetImage = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
      } else {
        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      setNewItem(n => ({ ...n, imageUrl: canvas.toDataURL('image/jpeg', 0.6) }));
      setUploading(false);
    };
    img.src = dataUrl;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => compressAndSetImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const filteredItems = data.items.filter(item => {
    const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
    const weatherMatch = activeWeather === 'All' || item.weatherTags.includes(activeWeather);
    return categoryMatch && weatherMatch;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.imageUrl) return;

    const item: ClothingItem = {
      id: editingItem || Math.random().toString(36).substr(2, 9),
      name: newItem.name,
      category: newItem.category as Category,
      imageUrl: newItem.imageUrl,
      weatherTags: (newItem.weatherTags as Weather[]) || ['Sunny']
    };

    if (editingItem) {
      setData(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === editingItem ? item : i)
      }));
    } else {
      setData(prev => ({ ...prev, items: [item, ...prev.items] }));
    }
    
    setIsAdding(false);
    setEditingItem(null);
    setNewItem({ category: 'Top', weatherTags: ['Sunny'] });
  };

  const deleteItem = (id: string) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id),
      outfits: prev.outfits.map(o => ({
        ...o,
        itemIds: o.itemIds.filter(itemId => itemId !== id)
      })).filter(o => o.itemIds.length > 0)
    }));
  };

  const startEdit = (item: ClothingItem) => {
    setNewItem(item);
    setEditingItem(item.id);
    setIsAdding(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl text-white">Closet</h3>
        <button 
          onClick={() => { setIsAdding(true); setEditingItem(null); setNewItem({ category: 'Top', weatherTags: ['Sunny'] }); }}
          className="bg-lavender-500 text-white flex items-center gap-2 px-6 py-3 rounded-[1.5rem] shadow-2xl shadow-lavender-500/20 font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all active:scale-95"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="space-y-4">
        <div className="px-1">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-3 block">Categories</label>
          <SlidingFilter className="-mx-4">
            {['All', ...CATEGORIES, 'Saved Outfits'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as any)}
                className={cn(
                  "relative group/cat shrink-0 w-40 aspect-[4/5] rounded-[2rem] overflow-hidden transition-all duration-300 ease-out border-2 snap-center",
                  activeCategory === cat 
                    ? "border-lavender-500 scale-105 shadow-2xl shadow-lavender-500/30" 
                    : "border-white/5 hover:border-white/20 opacity-60 hover:opacity-100"
                )}
              >
                  <img 
                    src={cat === 'Saved Outfits' ? 'https://images.unsplash.com/photo-1445205170230-053b830c6050?auto=format&fit=crop&q=80&w=400' : CATEGORY_COVERS[cat]} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/cat:scale-110" 
                    alt={cat}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                <div className={cn(
                  "absolute inset-0 transition-colors duration-500",
                  activeCategory === cat ? "bg-lavender-500/20" : "bg-black/40 group-hover/cat:bg-black/20"
                )} />
                <div className="absolute bottom-4 left-4 right-4 z-10 text-center">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white brightness-150 drop-shadow-lg">{cat}</p>
                </div>
              </button>
            ))}
          </SlidingFilter>
        </div>

        <div className="px-1">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-3 mt-4 block">Mood & Climate</label>
          <SlidingFilter className="-mx-4 border-t border-white/5 pt-6">
            <button
              onClick={() => setActiveWeather('All')}
              className={cn(
                "relative group/weather shrink-0 w-28 h-16 rounded-xl overflow-hidden transition-all duration-300 ease-out border snap-center",
                activeWeather === 'All' 
                  ? "border-lavender-500 scale-105 shadow-xl shadow-lavender-500/20" 
                  : "border-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <img 
                src={WEATHER_COVERS['All']} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/weather:scale-110" 
                alt="All Conditions"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594932224011-042041c65451?auto=format&fit=crop&q=80&w=100';
                }}
              />
              <div className={cn(
                "absolute inset-0 transition-colors duration-500",
                activeWeather === 'All' ? "bg-lavender-500/20" : "bg-black/40 group-hover/weather:bg-black/20"
              )} />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-1 z-10">
                 <CloudSun size={14} className="text-white mb-1 drop-shadow-md opacity-70" />
                 <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white brightness-150 drop-shadow-lg text-center leading-tight">All</p>
              </div>
            </button>
            {WEATHERS.map(w => {
              const Icon = w.icon;
              return (
                <button
                  key={w.type}
                  onClick={() => setActiveWeather(w.type as Weather)}
                  className={cn(
                    "relative group/weather shrink-0 w-28 h-16 rounded-xl overflow-hidden transition-all duration-300 ease-out border snap-center",
                    activeWeather === w.type 
                      ? "border-lavender-500 scale-105 shadow-xl shadow-lavender-500/20" 
                      : "border-white/5 opacity-60 hover:opacity-100"
                  )}
                >
                  <img 
                    src={WEATHER_COVERS[w.type]} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/weather:scale-110" 
                    alt={w.type}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594932224011-042041c65451?auto=format&fit=crop&q=80&w=100';
                    }}
                  />
                  <div className={cn(
                    "absolute inset-0 transition-colors duration-500",
                    activeWeather === w.type ? "bg-lavender-500/20" : "bg-black/40 group-hover/weather:bg-black/20"
                  )} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-1 z-10">
                    <Icon size={14} className="text-white mb-1 drop-shadow-md opacity-90" />
                    <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white brightness-150 drop-shadow-lg">{w.type}</p>
                  </div>
                </button>
              );
            })}
          </SlidingFilter>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {activeCategory === 'Saved Outfits' ? (
          <AnimatePresence>
            {data.outfits.map(outfit => (
              <motion.div
                key={outfit.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/5 rounded-3xl overflow-hidden shadow-2xl border border-white/5 group relative p-4 flex flex-col gap-3"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-900 flex gap-1">
                  {outfit.itemIds.slice(0, 3).map((id, idx) => (
                    <img 
                      key={idx} 
                      src={data.items.find(i => i.id === id)?.imageUrl} 
                      className="flex-1 object-cover h-full" 
                      referrerPolicy="no-referrer" 
                    />
                  ))}
                  {outfit.itemIds.length === 0 && <div className="w-full h-full bg-white/5" />}
                </div>
                <div>
                   <p className="text-[11px] font-bold text-white truncate px-1">{outfit.name}</p>
                   <div className="flex items-center justify-between mt-2">
                     <span className="text-[8px] uppercase font-black tracking-widest text-white/30 ml-1">{outfit.itemIds.length} items</span>
                     <div className="flex gap-1 opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            const newLog = { id: Math.random().toString(36).substr(2, 9), date: format(new Date(), 'yyyy-MM-dd'), outfitId: outfit.id };
                            setData(prev => ({ ...prev, logs: [...prev.logs, newLog] }));
                          }}
                          className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-mint-400 hover:bg-mint-500/10 transition-all font-bold"
                          title="Quick Log"
                        >
                          <Plus size={14} />
                        </button>
                        <button onClick={() => onEditOutfit(outfit)} className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-lavender-400 hover:bg-lavender-500/10 transition-all">
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => setData(prev => ({
                            ...prev,
                            outfits: prev.outfits.map(o => o.id === outfit.id ? { ...o, isFavorite: !o.isFavorite } : o)
                          }))}
                          className={cn(
                            "p-2 rounded-xl transition-all",
                            outfit.isFavorite ? "bg-fuchsia-500/20 text-fuchsia-400" : "bg-white/5 text-white/40 hover:text-fuchsia-400 hover:bg-fuchsia-500/10"
                          )}
                          title="Favorite"
                        >
                          <Heart size={14} fill={outfit.isFavorite ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => setData(prev => ({ ...prev, outfits: prev.outfits.filter(o => o.id !== outfit.id) }))} className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          <Trash2 size={14} />
                        </button>
                     </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <AnimatePresence>
            {filteredItems.map(item => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
              className="bg-white/5 rounded-2xl overflow-hidden shadow-2xl border border-white/5 group relative"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-slate-900">
                <img 
                  src={item.imageUrl} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  referrerPolicy="no-referrer" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594932224011-042041c65451?auto=format&fit=crop&q=80&w=400';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-3 bg-white/5 backdrop-blur-md">
                <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-0.5">
                  <div className="flex gap-1 items-center">
                    <span className="text-[8px] uppercase font-black tracking-[0.1em] text-lavender-400">{item.category}</span>
                    <div className="flex gap-0.5">
                      {item.weatherTags.slice(0, 2).map((wt, idx) => {
                        const WIcon = WEATHERS.find(w => w.type === wt)?.icon || Sun;
                        return <WIcon key={idx} size={8} className="text-white/30" />;
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => setData(prev => ({
                        ...prev,
                        items: prev.items.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i)
                      }))}
                      className={cn(
                        "p-1.5 rounded-lg bg-white/5 transition-colors",
                        item.isFavorite ? "text-fuchsia-500" : "text-white/40 hover:text-fuchsia-400"
                      )}
                      title="Favorite"
                    >
                      <Heart size={14} fill={item.isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button 
                      onClick={() => {
                        const outfitId = Math.random().toString(36).substr(2, 9);
                        setData(prev => {
                          const newOutfit = { id: outfitId, name: `${item.name} Look`, itemIds: [item.id] } as Outfit;
                          const newLog = { id: Math.random().toString(36).substr(2, 9), date: format(new Date(), 'yyyy-MM-dd'), outfitId };
                          return { ...prev, outfits: [newOutfit, ...prev.outfits], logs: [...prev.logs, newLog] };
                        });
                      }} 
                      className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-mint-400 transition-colors"
                      title="Quick Log"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={() => startEdit(item)} 
                      className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-lavender-400 transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => deleteItem(item.id)} 
                      className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-rose-400 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            key="add-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg"
          >
            <motion.form 
              key="add-modal-form"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", bounce: 0.3 }}
              onSubmit={handleAddItem}
              className="w-full max-w-sm bg-[#0f0c29]/90 rounded-[40px] p-8 shadow-2xl relative space-y-4 border border-white/10 backdrop-blur-2xl"
            >
            <button 
              type="button" 
              onClick={() => setIsAdding(false)} 
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all border border-white/10 shadow-xl"
              title="Close"
            >
              <X size={20} />
            </button>
            <h3 className="font-serif text-3xl mb-4 italic text-lavender-400">
              {editingItem ? 'Refine Item' : 'New Treasure'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Descriptor</label>
                <input 
                  type="text" 
                  value={newItem.name || ''} 
                  onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
                  placeholder="Vintage Silky Top"
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-lavender-200 text-white placeholder:text-white/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Classification</label>
                  <select 
                    value={newItem.category} 
                    onChange={e => setNewItem(n => ({ ...n, category: e.target.value as Category }))}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 ring-lavender-200 appearance-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 mb-2 block">Ideal Conditions</label>
                  <div className="flex flex-wrap gap-2">
                    {WEATHERS.map(w => {
                      const isSelected = newItem.weatherTags?.includes(w.type);
                      return (
                        <button
                          key={w.type}
                          type="button"
                          onClick={() => {
                            setNewItem(n => {
                              const tags = n.weatherTags || [];
                              return {
                                ...n,
                                weatherTags: isSelected ? tags.filter(t => t !== w.type) : [...tags, w.type]
                              }
                            });
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                            isSelected 
                              ? "bg-lavender-500 text-white border-lavender-500 shadow-lg shadow-lavender-500/20" 
                              : "bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white"
                          )}
                        >
                          {w.type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1 mb-2 block">Visual Identity</label>
                <div className="flex flex-col gap-2">
                  {showCamera ? (
                    <div className="relative w-full h-64 bg-black rounded-2xl overflow-hidden border-2 border-lavender-500">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
                        <button type="button" onClick={stopCamera} className="p-3 bg-red-500 text-white rounded-full"><X size={20} /></button>
                        <button type="button" onClick={capturePhoto} className="p-3 bg-white text-black rounded-full"><Camera size={20} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <label className={`flex-[2] bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm text-center text-white/60 hover:bg-white/10 cursor-pointer transition-colors focus-within:ring-2 ring-lavender-200 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={16} className="inline mr-2" /> {uploading ? 'Processing...' : 'Gallery'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <button type="button" onClick={startCamera} className="flex-1 bg-lavender-500/10 border border-lavender-500/20 text-lavender-300 rounded-2xl px-4 py-3 text-sm text-center hover:bg-lavender-500/20 cursor-pointer transition-colors focus-within:ring-2 ring-lavender-400">
                        <Camera size={16} className="inline mr-1" /> Camera
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-white/20 text-[10px] font-black uppercase tracking-widest">or link</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <input 
                      type="text" 
                      value={newItem.imageUrl || ''} 
                      onChange={e => setNewItem(n => ({ ...n, imageUrl: e.target.value }))}
                      placeholder="https://..."
                      className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-lavender-200 text-white placeholder:text-white/20"
                    />
                  </div>
                  {newItem.imageUrl && (
                    <div className="mt-2 w-full h-40 rounded-2xl overflow-hidden border-2 border-lavender-500/30 relative bg-black/20">
                      <img src={newItem.imageUrl} className="w-full h-full object-contain" alt="Preview" />
                      <button type="button" onClick={() => setNewItem(n => ({...n, imageUrl: ''}))} className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-red-500/80 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-lavender-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-lavender-500/20 hover:scale-[1.02] transition-transform mt-4"
            >
              {editingItem ? 'Store Changes' : 'Append to Closet'}
            </button>
          </motion.form>
        </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StudioView({ data, setData, initialOutfit, onClearInitial }: { data: UserData; setData: React.Dispatch<React.SetStateAction<UserData>>; initialOutfit?: Outfit | null; onClearInitial?: () => void; key?: string }) {
  const [outfitName, setOutfitName] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>(CATEGORIES[0]);
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null);

  useEffect(() => {
    if (initialOutfit) {
      setEditingOutfitId(initialOutfit.id);
      setOutfitName(initialOutfit.name);
      setSelectedItemIds(initialOutfit.itemIds);
      onClearInitial?.();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [initialOutfit, onClearInitial]);

  const handleSaveOutfit = () => {
    if (!outfitName || selectedItemIds.length === 0) return;
    
    if (editingOutfitId) {
      setData(prev => ({
        ...prev,
        outfits: prev.outfits.map(o => o.id === editingOutfitId ? { ...o, name: outfitName, itemIds: selectedItemIds } : o)
      }));
      setEditingOutfitId(null);
    } else {
      const newOutfit: Outfit = {
        id: Math.random().toString(36).substr(2, 9),
        name: outfitName,
        itemIds: selectedItemIds
      };

      setData(prev => ({
        ...prev,
        outfits: [newOutfit, ...prev.outfits]
      }));
    }

    setOutfitName('');
    setSelectedItemIds([]);
  };

  const startEditOutfit = (outfit: Outfit) => {
    setEditingOutfitId(outfit.id);
    setOutfitName(outfit.name);
    setSelectedItemIds(outfit.itemIds);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingOutfitId(null);
    setOutfitName('');
    setSelectedItemIds([]);
  };

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredItems = data.items.filter(i => i.category === activeCategory);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-24"
    >
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-2xl text-white">{editingOutfitId ? 'Reshape Look' : 'Outfit Builder'}</h3>
          {editingOutfitId && (
            <button 
              onClick={cancelEdit} 
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all shadow-xl backdrop-blur-md border border-white/10"
              title="Cancel Edit"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        <div className={cn(
          "bg-white/5 glass-card rounded-[40px] p-8 border shadow-2xl space-y-6 transition-all duration-500",
          editingOutfitId ? "border-lavender-500/50 ring-1 ring-lavender-500/20" : "border-white/5"
        )}>
          <input 
            type="text" 
            placeholder="Name your silhouette..."
            value={outfitName}
            onChange={e => setOutfitName(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 ring-lavender-500 text-white placeholder:text-white/20 transition-all"
          />

          <div className="flex flex-wrap gap-2 min-h-[140px] p-6 bg-white/5 border-2 border-dashed border-white/10 rounded-[32px] relative group overflow-hidden">
            {selectedItemIds.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center text-white/20 py-8">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                  <Palette size={32} className="text-lavender-400 opacity-50" />
                </div>
                <p className="text-xs font-bold italic opacity-60">Canvas Awaiting Muse...</p>
              </div>
            ) : (
              selectedItemIds.map(id => {
                const item = data.items.find(i => i.id === id);
                if (!item) return null;
                return (
                  <motion.div 
                    layoutId={id}
                    key={id} 
                    className="relative group transition-transform hover:scale-105"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                  >
                    <img src={item.imageUrl} className="w-20 h-24 object-cover rounded-xl shadow-xl border border-white/10" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => toggleItem(id)}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                );
              })
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-lavender-500/5 to-transparent pointer-events-none" />
          </div>

          <button 
            disabled={!outfitName || selectedItemIds.length === 0}
            onClick={handleSaveOutfit}
            className="w-full bg-lavender-500 disabled:opacity-20 disabled:grayscale text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-2xl shadow-lavender-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs"
          >
            {editingOutfitId ? 'Store Evolution' : 'Finalize Composition'}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 block mb-2 px-1">Wardrobe Repository</label>
        <SlidingFilter className="-mx-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "relative group/cat shrink-0 w-28 aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-300 ease-out border-2 snap-center",
                activeCategory === cat 
                  ? "border-lavender-500 scale-105 shadow-xl shadow-lavender-500/20" 
                  : "border-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <img 
                src={CATEGORY_COVERS[cat]} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/cat:scale-110" 
                alt={cat}
                referrerPolicy="no-referrer"
              />
              <div className={cn(
                "absolute inset-0 transition-colors",
                activeCategory === cat ? "bg-lavender-500/10" : "bg-black/40 group-hover/cat:bg-black/20"
              )} />
              <div className="absolute inset-0 flex items-center justify-center p-2">
                 <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white drop-shadow-md text-center">{cat}</p>
              </div>
            </button>
          ))}
        </SlidingFilter>

        <div className="grid grid-cols-3 gap-3">
          {filteredItems.map(item => {
            const isSelected = selectedItemIds.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={cn(
                  "relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-300",
                  isSelected ? "border-lavender-500 ring-4 ring-lavender-500/20 scale-95" : "border-white/5 hover:border-white/20"
                )}
              >
                <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className={cn(
                  "absolute inset-0 flex items-center justify-center transition-all",
                  isSelected ? "bg-lavender-500/40 backdrop-blur-[2px]" : "bg-transparent group-hover:bg-black/20"
                )}>
                  {isSelected && <Check size={24} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="pb-12">
        <h4 className="font-serif text-xl mb-6 text-white italic">Archived Looks</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {data.outfits.map(outfit => (
            <div key={outfit.id} className="bg-white/5 p-6 rounded-[32px] border border-white/5 shadow-2xl group hover:border-lavender-500/30 transition-all">
              <div className="flex gap-2 mb-4 overflow-hidden rounded-2xl h-24">
                {outfit.itemIds.slice(0, 4).map(id => (
                  <img key={id} src={data.items.find(i => i.id === id)?.imageUrl} className="flex-1 object-cover hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                ))}
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">{outfit.name}</p>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{outfit.itemIds.length} Pieces</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => startEditOutfit(outfit)}
                    className="bg-white/5 p-3 rounded-xl text-white/20 hover:text-lavender-400 hover:bg-lavender-500/10 transition-all"
                    title="Edit Outfit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setData(prev => ({
                      ...prev,
                      outfits: prev.outfits.map(o => o.id === outfit.id ? { ...o, isFavorite: !o.isFavorite } : o)
                    }))}
                    className={cn(
                      "p-3 rounded-xl transition-all",
                      outfit.isFavorite ? "bg-fuchsia-500/20 text-fuchsia-400" : "bg-white/5 text-white/20 hover:text-fuchsia-400 hover:bg-fuchsia-500/10"
                    )}
                  >
                    <Heart size={16} fill={outfit.isFavorite ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={() => setData(prev => ({ ...prev, outfits: prev.outfits.filter(o => o.id !== outfit.id) }))}
                    className="bg-white/5 p-3 rounded-xl text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function AiSuggestionPanel({ data, onUseOutfit, onCreateAndUseOutfit }: { data: UserData; onUseOutfit: (id: string) => void; onCreateAndUseOutfit: (outfit: Omit<Outfit, 'id'>) => void }) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ outfitName: string; reason: string; itemIds: string[] } | null>(null);
  const [targetWeather, setTargetWeather] = useState<Weather>('Sunny');

  const handleSuggest = async () => {
    setSuggesting(true);
    setSuggestion(null);

    try {
      const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });
      
      // Get last 3 days of outfits to avoid repetition
      const last3Days = data.logs
        .filter(log => differenceInDays(new Date(), parseISO(log.date)) <= 3)
        .map(log => data.outfits.find(o => o.id === log.outfitId)?.name)
        .filter(Boolean);

      const prompt = `
        As a personal stylist for a "Style Diary" app, suggest a brand new outfit for today.
        User's Wardrobe Items: ${data.items.map(i => `[ID: ${i.id}] ${i.name} (${i.category})`).join(', ')}
        Existing Named Outfits: ${data.outfits.map(o => o.name).join(', ')}
        Recent Outfits (last 3 days, DO NOT REPEAT): ${last3Days.join(', ')}
        Target Weather: ${targetWeather}

        Create a great silhouette using specifically the clothing items and accessories in their wardrobe! Provide the precise IDs of the pieces you chose.
        Return a JSON object only:
        {
          "outfitName": "A catchy, stylish name for this new look",
          "reason": "Explain why this fits the ${targetWeather} weather and why it looks great, whilst avoiding the recent outfits.",
          "itemIds": ["id1", "id2", "id3"]
        }
      `;

      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      setSuggestion(JSON.parse(response.text || '{}'));
    } catch (err) {
      console.error("AI Error:", err);
      // Fallback
      if (data.outfits.length > 0) {
        setSuggestion({ 
          outfitName: data.outfits[0].name, 
          reason: "I couldn't reach the stars, but this classic look always works for " + targetWeather + " days!",
          itemIds: data.outfits[0].itemIds
        });
      }
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="bg-lavender-50 border border-black/60 rounded-[48px] p-3 shadow-2xl">
      <div className="bg-lavender-100/40 rounded-[40px] p-8 text-white relative overflow-hidden group border border-lavender-100">
        <div className="absolute top-0 right-0 w-48 h-48 bg-lavender-500/10 rounded-full -translate-y-20 translate-x-20 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="bg-lavender-500/10 p-3 rounded-2xl border border-lavender-500/20">
            <Sparkles className="text-lavender-300" size={24} />
          </div>
          <div>
            <h4 className="font-serif italic text-2xl tracking-tight leading-none mb-1 text-lavender-100">
              <span className="text-white">Style Muse</span> AI
            </h4>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Celestial Curation</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!suggestion && !suggesting && (
            <motion.div 
              key="button"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="text-center relative z-10"
            >
              <p className="text-sm opacity-60 mb-6 px-6 leading-relaxed font-medium">Consult the digital oracle for a silhouette that mirrors the day's energy.</p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-8 px-4">
                {WEATHERS.map(w => (
                  <button
                    key={w.type}
                    onClick={() => setTargetWeather(w.type)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                      targetWeather === w.type 
                        ? "bg-lavender-500/20 text-lavender-300 border border-lavender-500/50" 
                        : "bg-white/5 text-white/40 border border-transparent hover:border-white/10"
                    )}
                  >
                    {w.type}
                  </button>
                ))}
              </div>

              <button 
                onClick={handleSuggest}
                className="bg-lavender-500 hover:bg-lavender-400 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-lavender-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                Consult Muse
              </button>
            </motion.div>
          )}

          {suggesting && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-8 relative z-10"
            >
              <div className="w-12 h-12 border-4 border-white/20 border-t-lavender-400 rounded-full animate-spin mb-4" />
              <p className="font-serif italic text-lg opacity-90 animate-pulse text-lavender-200">AI is thinking...</p>
            </motion.div>
          )}

          {suggestion && (
            <motion.div 
              key="suggestion"
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 relative z-10"
            >
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-lavender-300 block mb-2">Recommended Look</span>
                <p className="font-serif text-3xl italic mb-4 leading-tight text-white">{suggestion.outfitName}</p>
                
                {suggestion.itemIds && suggestion.itemIds.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                    {suggestion.itemIds.map(id => {
                      const item = data.items.find(i => i.id === id);
                      if (!item) return null;
                      return (
                        <div key={id} className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/20 relative group">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-[8px] font-black uppercase text-center leading-tight px-1">{item.name}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="h-px bg-gradient-to-r from-lavender-500/50 to-transparent w-full mb-4" />
                <p className="text-sm opacity-90 leading-relaxed text-lavender-100 font-medium">"{suggestion.reason}"</p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleSuggest}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-4 rounded-xl transition-colors border border-white/10 shadow-inner"
                >
                  Refresh
                </button>
                <button 
                  onClick={() => {
                    const existing = data.outfits.find(o => o.name === suggestion.outfitName);
                    if (existing) {
                      onUseOutfit(existing.id);
                    } else if (suggestion.itemIds && suggestion.itemIds.length > 0) {
                      onCreateAndUseOutfit({
                        name: suggestion.outfitName,
                        itemIds: suggestion.itemIds
                      });
                    }
                    setSuggestion(null);
                  }}
                  className="flex-[2] bg-gradient-to-r from-lavender-500 to-lavender-400 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl shadow-lg border border-lavender-400/50"
                >
                  Journal This
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatsView({ data, setData, score, user, onEditOutfit }: { data: UserData; setData: React.Dispatch<React.SetStateAction<UserData>>; score: number; user: any; onEditOutfit: (o: Outfit) => void; key?: string }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    archetypes: { name: string; score: number }[];
    palette: string[];
    silhouettes: string[];
    summary: string;
  } | null>(null);

  const [favoriteWeather, favoriteCategory] = useMemo(() => {
    let wCount: Record<string, number> = {};
    let cCount: Record<string, number> = {};
    data.logs.forEach(log => {
      const outfit = data.outfits.find(o => o.id === log.outfitId);
      if (outfit) {
        outfit.itemIds.forEach(id => {
          const item = data.items.find(i => i.id === id);
          if (item) {
            item.weatherTags.forEach(t => wCount[t] = (wCount[t] || 0) + 1);
            cCount[item.category] = (cCount[item.category] || 0) + 1;
          }
        });
      }
    });
    
    const favW = Object.entries(wCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
    const favC = Object.entries(cCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A';
    return [favW, favC];
  }, [data]);

  const handleStyleAnalysis = async () => {
    setAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });
      
      const wardrobeSummary = data.items.map(i => `${i.name} (${i.category})`).join(', ');
      const historySummary = data.logs.map(l => {
        const o = data.outfits.find(outf => outf.id === l.outfitId);
        return o ? o.name : 'Unknown';
      }).join(', ');

      const prompt = `
        Analyze the user's fashion style based on their wardrobe and history.
        Wardrobe contains: ${wardrobeSummary}
        Logging history of outfits: ${historySummary}

        Respond ONLY with a JSON object containing:
        1. "archetypes": Array of { "name": string, "score": number } (5 items, scores 0-100).
        2. "palette": Array of 5 hex or color name strings.
        3. "silhouettes": Array of 3 key silhouette descriptions.
        4. "summary": A poetic 2-sentence summary of their style essence.
      `;

      const response = await ai.models.generateContent({ 
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      setAnalysis(JSON.parse(response.text || '{}'));
    } catch (err) {
      console.error("AI Error:", err);
      // Fallback
      setAnalysis({
        archetypes: [{name: "Unknown", score: 50}],
        palette: ["#888"],
        silhouettes: ["Undefined"],
        summary: "The stars are silent today."
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const favoriteOutfits = data.outfits.filter(o => o.isFavorite);
  const favoriteItems = data.items.filter(i => i.isFavorite);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-24">
      <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white/5 to-transparent rounded-[3rem] shadow-xl relative overflow-hidden border border-white/5">
        <div className="absolute inset-0 bg-lavender-500/5 blur-3xl rounded-full translate-y-12" />
        <div className="w-24 h-24 rounded-full border-4 border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.3)] overflow-hidden mb-4 bg-white/10 flex items-center justify-center text-4xl font-serif text-white relative z-10">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            user?.displayName?.charAt(0).toUpperCase() || 'A'
          )}
        </div>
        <h3 className="font-serif text-2xl text-white uppercase tracking-widest leading-none drop-shadow-md relative z-10">{user?.displayName || 'Muse'}</h3>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mt-2 mb-6 relative z-10 truncate max-w-full italic">{user?.email}</p>
        
        <button 
          onClick={() => import('./lib/firebase').then(m => m.logout())}
          className="flex items-center gap-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 px-6 py-2 rounded-full transition-all text-[10px] font-black uppercase tracking-widest shadow-lg border border-rose-500/20 relative z-10"
        >
          Sign Out
        </button>
      </div>

      {/* AI Style Analysis Section */}
      <section className="bg-white/5 glass-card rounded-[2.5rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[50px] -translate-y-16 translate-x-16" />
        
        <div className="flex items-center justify-between mb-8">
           <div>
             <h4 className="font-serif text-2xl text-white italic">Style Scryer</h4>
             <p className="text-[9px] font-black uppercase tracking-widest text-fuchsia-400 mt-1">Deep Soul Analysis</p>
           </div>
           <button 
             onClick={handleStyleAnalysis}
             disabled={analyzing}
             className={cn(
               "p-4 rounded-2xl transition-all shadow-xl",
               analyzing ? "bg-white/5 animate-pulse" : "bg-gradient-to-br from-fuchsia-500 to-lavender-500 hover:scale-105 active:scale-95"
             )}
           >
             {analyzing ? <Wand2 size={24} className="animate-spin text-white" /> : <Sparkles size={24} className="text-white" />}
           </button>
        </div>

        {analysis ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="h-64 w-full -mx-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={analysis.archetypes}>
                  <PolarGrid stroke="#ffffff20" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#c175ff', fontSize: 10, fontWeight: 900 }} />
                  <Radar
                    name="Archetype"
                    dataKey="score"
                    stroke="#e84393"
                    fill="#e84393"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-black/20 rounded-3xl p-6 border border-white/5 group relative">
               <p className="text-sm italic leading-relaxed text-lavender-100 font-medium line-clamp-4 group-hover:line-clamp-none transition-all">
                 "{analysis.summary}"
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3 ml-2">Essence Palette</h5>
                  <div className="flex flex-wrap gap-2 px-1">
                    {analysis.palette.map((color, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-xl shadow-lg border border-white/10 flex items-center justify-center text-[8px] font-black uppercase text-center p-1" style={{ backgroundColor: color }}>
                          <span className="mix-blend-difference text-white opacity-40">{color}</span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
               <div>
                  <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3 ml-2">Preferred Forms</h5>
                  <div className="flex flex-wrap gap-2 px-1">
                    {analysis.silhouettes.map((s, i) => (
                      <span key={i} className="bg-white/5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-lavender-300 border border-lavender-500/20">{s}</span>
                    ))}
                  </div>
               </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-10">
             <Compass className="mx-auto mb-4 text-white/10 animate-pulse" size={48} />
             <p className="text-sm font-medium text-white/30 italic">Place your focus here to scry your style's deepest truths.</p>
          </div>
        )}
      </section>

      {/* Legacy Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 glass-card rounded-[2.5rem] p-6 text-center border border-white/5 shadow-lg group hover:border-fuchsia-500/30 transition-colors">
          <p className="text-4xl font-black text-fuchsia-400 drop-shadow-md mb-2 group-hover:scale-110 transition-transform">{data.logs.length}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Echos Recorded</p>
        </div>
        <div className="bg-white/5 glass-card rounded-[2.5rem] p-6 text-center border border-white/5 shadow-lg group hover:border-lavender-500/30 transition-colors">
          <p className="text-4xl font-black text-lavender-400 drop-shadow-md mb-2 group-hover:scale-110 transition-transform">{data.items.length}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Loom Inventory</p>
        </div>
      </div>

      <div className="bg-white/5 glass-card rounded-[2rem] p-8 border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-lavender-500/5 blur-[40px] rounded-full" />
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]" />
          <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-white">Atmospheric Alignment</h4>
        </div>
        <p className="text-sm font-medium leading-relaxed text-white/60 relative z-10">
          Based on your logs, you gravitate towards <span className="text-fuchsia-400 font-bold italic">ethereal layers</span> during {favoriteWeather.toLowerCase()} weather. 
          Your most successful combinations often feature <span className="text-fuchsia-400 font-bold italic">{favoriteCategory}s</span>.
        </p>
      </div>

      <div className="bg-white/5 glass-card rounded-[2rem] p-8 border border-white/5 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-lavender-400 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-white">Recent Echoes</h4>
          </div>
          <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">{data.outfits.length} Total</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
           {data.outfits.slice(0, 6).length === 0 ? (
             <div className="w-full text-center py-8 border-2 border-dashed border-white/5 rounded-2xl">
               <p className="text-[9px] uppercase font-black tracking-[0.3em] text-white/20">No threads woven yet.</p>
             </div>
           ) : (
             data.outfits.slice(0, 6).map(outfit => (
               <div key={outfit.id} className="w-32 shrink-0 aspect-[4/5] bg-black/40 rounded-[2rem] overflow-hidden relative border border-white/5 shadow-2xl group snap-center">
                  {outfit.itemIds[0] ? (
                    <img src={data.items.find(i => i.id === outfit.itemIds[0])?.imageUrl} className="w-full h-full object-cover mix-blend-luminosity opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" referrerPolicy="no-referrer" />
                  ) : <div className="w-full h-full bg-white/5" />}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#0a0410] via-[#0a0410]/95 to-transparent">
                    <p className="text-[8px] uppercase font-black text-white truncate text-center tracking-widest brightness-150 drop-shadow-md">{outfit.name}</p>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>

      {/* Favorites Vault */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <div className="h-px bg-white/10 flex-1"></div>
          <h4 className="font-black text-[10px] uppercase tracking-[0.4em] text-lavender-400">The Vault</h4>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        {/* Favorite Outfits */}
        <div className="bg-white/5 glass-card rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Heart className="text-fuchsia-500 fill-fuchsia-500" size={18} />
              <h4 className="font-serif text-xl text-white italic">Treasured Looks</h4>
            </div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{favoriteOutfits.length}</span>
          </div>
          
          {favoriteOutfits.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <p className="text-sm italic text-white/20">The vault is currently empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {favoriteOutfits.map(outfit => (
                <div key={outfit.id} className="bg-white/5 p-4 rounded-3xl border border-white/10 flex items-center gap-4 group">
                  <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden relative">
                    <img 
                      src={data.items.find(i => i.id === outfit.itemIds[0])?.imageUrl} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{outfit.name}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{outfit.itemIds.length} Pieces</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        const newLog = { id: Math.random().toString(36).substr(2, 9), date: format(new Date(), 'yyyy-MM-dd'), outfitId: outfit.id };
                        setData(prev => ({ ...prev, logs: [...prev.logs, newLog] }));
                      }}
                      className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-mint-400"
                      title="Log Today"
                    >
                      <Plus size={14} />
                    </button>
                    <button 
                      onClick={() => onEditOutfit(outfit)}
                      className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-lavender-400"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => setData(prev => ({
                        ...prev,
                        outfits: prev.outfits.map(o => o.id === outfit.id ? { ...o, isFavorite: !o.isFavorite } : o)
                      }))}
                      className="p-2 bg-fuchsia-500/10 text-fuchsia-500 rounded-xl"
                      title="Unfavorite"
                    >
                      <Heart size={14} fill="currentColor" />
                    </button>
                    <button 
                      onClick={() => setData(prev => ({ ...prev, outfits: prev.outfits.filter(o => o.id !== outfit.id) }))}
                      className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorite Items */}
        <div className="bg-white/5 glass-card rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Shirt className="text-lavender-400" size={18} />
              <h4 className="font-serif text-xl text-white italic">Signature Pieces</h4>
            </div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{favoriteItems.length}</span>
          </div>

          {favoriteItems.length === 0 ? (
             <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-3xl">
               <p className="text-sm italic text-white/20">No treasures marked yet.</p>
             </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {favoriteItems.map(item => (
                <div key={item.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group border border-white/10">
                  <img src={item.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[9px] font-bold text-white truncate mb-2">{item.name}</p>
                    <div className="flex gap-1 justify-center">
                      <button 
                        onClick={() => {
                          const outfitId = Math.random().toString(36).substr(2, 9);
                          setData(prev => {
                            const newOutfit = { id: outfitId, name: `${item.name} Look`, itemIds: [item.id] } as Outfit;
                            return { 
                              ...prev, 
                              outfits: [newOutfit, ...prev.outfits], 
                              logs: [...prev.logs, { id: Math.random().toString(36).substr(2, 9), date: format(new Date(), 'yyyy-MM-dd'), outfitId }] 
                            };
                          });
                        }}
                        className="p-1.5 bg-black/60 rounded-lg text-white hover:text-mint-400"
                        title="Log Today"
                      >
                        <Plus size={12} />
                      </button>
                      <button 
                        onClick={() => setData(prev => ({
                          ...prev,
                          items: prev.items.map(i => i.id === item.id ? { ...i, isFavorite: !i.isFavorite } : i)
                        }))}
                        className="p-1.5 bg-fuchsia-500/80 rounded-lg text-white"
                        title="Unfavorite"
                      >
                        <Heart size={12} fill="currentColor" />
                      </button>
                      <button 
                         onClick={() => setData(prev => ({
                           ...prev,
                           items: prev.items.filter(i => i.id !== item.id),
                           outfits: prev.outfits.map(o => ({ ...o, itemIds: o.itemIds.filter(id => id !== item.id) })).filter(o => o.itemIds.length > 0)
                         }))}
                         className="p-1.5 bg-black/60 rounded-lg text-white hover:text-rose-400"
                         title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
