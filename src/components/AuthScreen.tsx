import { motion } from 'motion/react';
import { BookHeart } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export function AuthScreen({ onSignedUp }: { onSignedUp: () => void; key?: string }) {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      onSignedUp();
    } catch (e) {
      console.error(e);
      alert("Failed to authenticate with Google. Ensure you are not blocking popups.");
    }
  };

  return (
    <motion.div 
      className="flex flex-col min-h-screen text-slate-100 p-6 items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #180537 0%, #3d1469 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute top-1/4 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/30 rounded-full blur-[100px] -z-10 mix-blend-screen" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-48 h-48 bg-white/10 rounded-[2.5rem] p-0 mb-10 flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.5)] border border-lavender-400/20 backdrop-blur-3xl relative overflow-hidden group"
      >
        <img 
          src="https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/1b/ff/82/1bff82fc-c7ce-c95c-1fcb-2fdaff76d5a1/AppIcon-0-0-1x_U007epad-0-1-85-220.png/1200x630wa.jpg" 
          alt="Style Alchemist Logo" 
          className="w-full h-full object-cover scale-125 relative z-10 transition-transform duration-700 group-hover:scale-150" 
        />
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 to-lavender-500/20 mix-blend-overlay z-20"></div>
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-12"
      >
        <p className="font-serif italic text-white/80 mb-2">Welcome to</p>
        <h1 className="text-4xl font-serif font-black text-white/90 mb-8 drop-shadow-2xl uppercase tracking-widest text-center leading-[1.1]">
          Style<br/>Diary
        </h1>
        <p className="text-[10px] font-black tracking-[0.4em] text-white/50 uppercase">
          Curate &bull; Remember &bull; Manifest
        </p>
      </motion.div>

      <motion.button 
        onClick={handleLogin}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm rounded-full py-4 font-bold text-sm tracking-widest uppercase transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center gap-3"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 bg-white rounded-full p-0.5">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </motion.button>
    </motion.div>
  );
}
