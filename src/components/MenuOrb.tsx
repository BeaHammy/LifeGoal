import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Zap,
  MessageSquare,
  ListTodo,
  Plus,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { cn } from '@/lib/utils';

export interface MenuOrbProps {
  className?: string;
  isAbsolute?: boolean;
}

export const MenuOrb: React.FC<MenuOrbProps> = ({ className, isAbsolute = false }) => {
  const [isOrbExpanded, setIsOrbExpanded] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setChatOpen = useStore((state) => state.setChatOpen);
  const setTaskPanelOpen = useStore((state) => state.setTaskPanelOpen);
  const dailyTasks = useStore((state) => state.dailyTasks);

  React.useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  const isDashboard = location.pathname === '/';

  const handleOrbClick = () => {
    if (isDesktop) {
      setTaskPanelOpen(true);
    } else {
      setIsOrbExpanded(!isOrbExpanded);
    }
  };

  return (
    <div className={cn(
      isAbsolute ? "absolute" : "fixed",
      "z-[200] transition-all duration-500",
      !className && !isAbsolute && (
        isDashboard && isDesktop 
          ? "right-[calc(50%-580px)] top-[70%] -translate-y-1/2" 
          : "bottom-8 right-8 md:bottom-12 md:right-12"
      ),
      className
    )}>
      <AnimatePresence>
        {isOrbExpanded && !isDesktop && (
          <>
            {/* Backdrop for closing */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrbExpanded(false)}
              className="fixed inset-0 z-[-1]"
            />
            
            {/* Action Dots */}
            <div className="absolute bottom-full right-0 mb-4 flex flex-col items-center gap-3">
              {/* Dashboard / Come Back Dot */}
              {!isDashboard && (
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.5 }}
                  transition={{ delay: 0.15 }}
                  onClick={() => {
                    setIsOrbExpanded(false);
                    navigate('/');
                  }}
                  className="w-12 h-12 rounded-full glass-card border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all group relative"
                >
                  <LayoutDashboard className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="absolute right-full mr-4 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Dashboard
                  </div>
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              )}

              {/* Stats & Achievements Dot */}
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.5 }}
                transition={{ delay: 0.1 }}
                onClick={() => {
                  setIsOrbExpanded(false);
                  navigate('/stats');
                }}
                className="w-12 h-12 rounded-full glass-card border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all group relative"
              >
                <Trophy className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="absolute right-full mr-4 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Stats & Achievements
                </div>
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>

              {/* Chat Dot */}
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.5 }}
                transition={{ delay: 0.05 }}
                onClick={() => {
                  setIsOrbExpanded(false);
                  setChatOpen(true);
                }}
                className="w-12 h-12 rounded-full glass-card border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all group relative"
              >
                <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="absolute right-full mr-4 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Chat
                </div>
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>

              {/* Quick Task Dot */}
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.5 }}
                onClick={() => {
                  setIsOrbExpanded(false);
                  setTaskPanelOpen(true);
                }}
                className="w-12 h-12 rounded-full glass-card border border-white/10 flex items-center justify-center hover:border-primary/50 transition-all group relative"
              >
                <ListTodo className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="absolute right-full mr-4 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Daily Tasks {dailyTasks.length > 0 && `(${dailyTasks.length})`}
                </div>
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                {dailyTasks.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] font-black text-black">
                    {dailyTasks.length}
                  </div>
                )}
              </motion.button>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main Orb */}
      <motion.button
        onClick={handleOrbClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "w-12 h-12 md:w-14 md:h-14 rounded-full glass-card border border-white/10 flex items-center justify-center transition-all group relative z-[201]",
          (isOrbExpanded && !isDesktop) ? "border-primary/50 neon-glow" : "hover:border-primary/30"
        )}
      >
        <motion.div
          animate={{ rotate: (isOrbExpanded && !isDesktop) ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Zap className={cn(
            "w-5 h-5 md:w-6 md:h-6 transition-colors",
            (isOrbExpanded && !isDesktop) ? "text-primary fill-primary/20" : "text-muted-foreground group-hover:text-primary"
          )} />
        </motion.div>
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {dailyTasks.length > 0 && !isOrbExpanded && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-black text-black shadow-[0_0_10px_rgba(217,70,239,0.5)]">
            {dailyTasks.length}
          </div>
        )}

        {/* Quick Task Label for Desktop */}
        {isDesktop && (
          <div className="absolute right-full mr-2 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Daily Tasks {dailyTasks.length > 0 && `(${dailyTasks.length})`}
          </div>
        )}
      </motion.button>
    </div>
  );
};
