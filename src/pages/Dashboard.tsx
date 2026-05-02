import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SharedRadar } from '../components/SharedRadar';
import { useStore, DimensionType } from '../store/useStore';
import { 
  Zap, User, Briefcase, Users, Palette, Activity, Coins
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Button } from '../components/ui/button';

import { MenuOrb } from '../components/MenuOrb';

const COLORS = ['#a855f7', '#d946ef', '#22d3ee', '#10b981', '#f59e0b', '#ef4444'];

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  'Work & Learning': Briefcase,
  'Social': Users,
  'Hobby & Creativity': Palette,
  'Health & Wellness': Activity,
  'Finance': Coins,
  'Everyday Activities': Zap
};

export const Dashboard: React.FC = () => {
  const dimensions = useStore((state) => state.dimensions);
  const activeGoalsCount = useStore((state) => state.goals.filter(g => g.active).length);
  const finishedTasksCount = useStore((state) => state.completedTasks.length);
  const navigate = useNavigate();
  
  const dimensionList = Object.values(dimensions);
  
  // Tilt effect for radar
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { damping: 30 });
  const mouseYSpring = useSpring(y, { damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["25deg", "-25deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-25deg", "25deg"]);
  const translateZ = useTransform(mouseYSpring, [-0.5, 0.5], [20, -20]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="h-full flex flex-col p-0 md:px-6 lg:px-8 space-y-0 max-w-7xl mx-auto overflow-y-auto lg:overflow-visible relative no-scrollbar">
      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center p-4 mb-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-all"
          >
            <User className="w-5 h-5 text-primary fill-primary/20" />
          </button>
          <div className="flex flex-col">
            <div className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold leading-tight">
              {activeGoalsCount} ACTIVE GOALS
            </div>
            <div className="text-[8px] text-primary uppercase tracking-widest font-black leading-tight">
              {finishedTasksCount} TASKS SYNCED
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-start py-0 md:pt-4 pb-40 md:pb-8 relative">
        {/* Radar Chart Section */}
        <div 
          className="w-full md:w-full max-w-none md:max-w-[1050px] aspect-square relative flex items-center justify-center perspective-1000"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Menu Orb positioned for Dashboard */}
          <div className="absolute z-[200] right-2 md:-right-10 lg:-right-16 bottom-[-20px]">
            <MenuOrb isAbsolute className="relative bottom-auto right-auto" />
          </div>
          <motion.div 
            style={{ rotateX, rotateY, translateZ, transformStyle: "preserve-3d" }}
            className="w-full h-full relative border-0 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-[80px] md:blur-[150px] animate-pulse-glow" style={{ transform: "translateZ(-50px)" }} />
            <SharedRadar 
              onDimensionClick={(dim) => navigate(`/dimension/${encodeURIComponent(dim)}`)} 
              className="w-full h-full"
            />
            {/* Holographic Ring Decor */}
            <div className="absolute inset-0 border border-primary/10 rounded-full animate-spin-slow pointer-events-none" style={{ transform: "translateZ(30px) scale(0.95)" }} />
          </motion.div>
        </div>

        {/* Dimension Labels (Legend) */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 w-full mt-12 mb-12 px-4 max-w-2xl">
          {dimensionList.map((dim, i) => (
            <motion.button
              key={dim.name}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/dimension/${encodeURIComponent(dim.name)}`)}
              className="flex flex-col items-center gap-3 group transition-all"
            >
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_20px_-5px] group-hover:bg-white/[0.05]"
                style={{ 
                  backgroundColor: `${COLORS[i % COLORS.length]}10`,
                  boxShadow: `0 0 0px ${COLORS[i % COLORS.length]}00`,
                  color: COLORS[i % COLORS.length]
                }}
              >
                {React.createElement(DIMENSION_ICONS[dim.name], {
                  size: 24,
                  strokeWidth: 1.5
                })}
              </div>
              <motion.span 
                layoutId={`label-${dim.name}`}
                className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 group-hover:text-white/90 transition-colors text-center leading-relaxed h-8 flex flex-col justify-center"
              >
                {dim.name.split(' & ').map((part, idx) => (
                  <span key={idx} className="block">{part}</span>
                ))}
              </motion.span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
