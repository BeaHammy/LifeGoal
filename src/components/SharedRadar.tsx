import React, { useMemo } from 'react';
import { motion, useSpring, useTransform, MotionValue } from 'motion/react';
import { 
  Briefcase, 
  Users, 
  Palette, 
  Activity, 
  Coins, 
  Zap 
} from 'lucide-react';
import { useStore, DimensionType } from '../store/useStore';
import { cn } from '../lib/utils';

interface SharedRadarProps {
  activeDimension?: DimensionType;
  isHeader?: boolean;
  rotationOffset?: MotionValue<number>;
  onDimensionClick?: (dimension: string) => void;
  className?: string;
  layoutId?: string;
}

const COLORS = ['#a855f7', '#d946ef', '#22d3ee', '#10b981', '#f59e0b', '#ef4444'];
const DIMENSION_KEYS: DimensionType[] = [
  'Work & Learning',
  'Social',
  'Hobby & Creativity',
  'Health & Wellness',
  'Finance',
  'Everyday Activities'
];

const DIMENSION_ICONS: Record<DimensionType, React.ElementType> = {
  'Work & Learning': Briefcase,
  'Social': Users,
  'Hobby & Creativity': Palette,
  'Health & Wellness': Activity,
  'Finance': Coins,
  'Everyday Activities': Zap
};

export const SharedRadar: React.FC<SharedRadarProps> = ({ 
  activeDimension, 
  isHeader = false, 
  rotationOffset,
  onDimensionClick,
  className,
  layoutId = "shared-radar"
}) => {
  const dimensions = useStore((state) => state.dimensions);
  const dimensionValues = Object.values(dimensions);
  const totalPoints = dimensionValues.reduce((sum, d) => sum + d.points, 0);

  // Responsive Constants
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Internal coordinate system (abstract units)
  const isMobile = windowWidth < 768;
  const VIEWBOX_SIZE = 1200;
  const CENTER = VIEWBOX_SIZE / 2;
  
  // Maximize radius relative to center (600)
  // reserving space for icons (approx 60 radius) at the edges
  // 480 radius + 60 icon half-width = 540. Icon center at 540.
  // 540 + 60 = 600. Fits exactly.
  const radius = isHeader ? 480 : 460; 
  const iconRadius = radius + (isMobile ? 60 : 70); 
  
  const centerX = CENTER;
  const centerY = CENTER;
  const viewBoxSize = VIEWBOX_SIZE;

  const data = useMemo(() => {
    return DIMENSION_KEYS.map((key, i) => {
      const d = dimensions[key];
      const share = totalPoints > 0 ? (d.points / totalPoints) * 100 : 0;
      return {
        subject: key,
        value: share,
        color: COLORS[i % COLORS.length]
      };
    });
  }, [dimensions, totalPoints]);

  const activeIndex = activeDimension ? DIMENSION_KEYS.indexOf(activeDimension) : -1;
  
  // Base rotation: active dimension at top (-90 degrees)
  // If no active dimension (dashboard), keep it at 0 or a neutral angle
  const baseRotation = activeIndex !== -1 ? -activeIndex * 60 : 0;

  const getPoint = (index: number, value: number, currentRadius: number) => {
    const angle = ((index * 60) - 90) * (Math.PI / 180);
    // Add a minimum value so the graph doesn't vanish entirely if points are 0
    const normalizedValue = Math.max(value, 5); 
    const r = (normalizedValue / 100) * currentRadius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  };

  const getGridPoint = (index: number, r: number) => {
    const angle = ((index * 60) - 90) * (Math.PI / 180);
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    };
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
  
  // Generate data polygon path
  const dataPath = data.map((d, i) => {
    const p = getPoint(i, d.value, radius);
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }).join(' ') + ' Z';

  return (
    <motion.div 
      layoutId={layoutId}
      transition={{ type: "spring", damping: 25, stiffness: 120 }}
      className={cn(
        "relative w-full aspect-square flex items-center justify-center overflow-visible", 
        className
      )}
    >
      <motion.svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        className="w-full h-full overflow-visible drop-shadow-[0_0_20px_rgba(168,85,247,0.2)]"
        animate={{ rotate: baseRotation }}
        style={rotationOffset ? { rotate: rotationOffset } : undefined}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
      >
        <defs>
          <radialGradient id="radarMainGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#d946ef" stopOpacity={0.05} />
          </radialGradient>
        </defs>

        {/* Grid Lines */}
        <g>
          {gridLevels.map(level => {
            const r = radius * level;
            const path = DIMENSION_KEYS.map((_, i) => {
              const p = getGridPoint(i, r);
              return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
            }).join(' ') + ' Z';
            return (
              <path
                key={`grid-${level}`}
                d={path}
                fill="none"
                stroke="white"
                strokeOpacity={0.05}
                strokeWidth={2}
              />
            );
          })}
          {DIMENSION_KEYS.map((_, i) => {
            const p = getGridPoint(i, radius);
            return (
              <line
                key={`radial-${i}`}
                x1={centerX}
                y1={centerY}
                x2={p.x}
                y2={p.y}
                stroke="white"
                strokeOpacity={0.05}
                strokeWidth={2}
              />
            );
          })}
        </g>

        {/* Data Polygon Layers for 3D Depth */}
        <motion.path
          d={dataPath}
          fill="url(#radarMainGradient)"
          stroke="white"
          strokeOpacity={0.05}
          strokeWidth={2}
          initial={false}
          style={{ transform: "translateZ(-10px)" }}
          transition={{ type: "spring", damping: 30, stiffness: 150 }}
        />
        
        <motion.path
          d={dataPath}
          fill="transparent"
          stroke="white"
          strokeOpacity={0.2}
          strokeWidth={4}
          initial={false}
          style={{ transform: "translateZ(10px)" }}
          transition={{ type: "spring", damping: 30, stiffness: 150 }}
        />

        {/* Main Data Polygon */}
        <motion.path
          d={dataPath}
          fill="url(#radarMainGradient)"
          stroke="white"
          strokeOpacity={0.15}
          strokeWidth={3}
          initial={false}
          transition={{ type: "spring", damping: 30, stiffness: 150 }}
        />

        {/* Dimension Points and Labels (Stacked on top) */}
        {data.map((d, i) => {
          const gridP = getGridPoint(i, radius);
          const iconP = getGridPoint(i, iconRadius);
          const dataP = getPoint(i, d.value, radius);
          
          return (
            <g key={d.subject} className="pointer-events-auto">
              <motion.circle
                cx={dataP.x}
                cy={dataP.y}
                r={isHeader ? 10 : 8}
                fill={d.color}
                initial={false}
                transition={{ type: "spring", damping: 30, stiffness: 150 }}
                className="cursor-pointer"
                style={{ filter: `drop-shadow(0 0 15px ${d.color})` }}
                onClick={() => onDimensionClick?.(d.subject)}
              />
              
              {!isHeader && (
                <foreignObject
                  x={iconP.x - (isMobile ? 50 : 60)}
                  y={iconP.y - (isMobile ? 50 : 60)}
                  width={isMobile ? 100 : 120}
                  height={isMobile ? 100 : 120}
                  className="overflow-visible"
                >
                  <div 
                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer group"
                    onClick={() => onDimensionClick?.(d.subject)}
                  >
                    <motion.div
                      layoutId={`icon-${d.subject}`}
                      className="relative"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {React.createElement(DIMENSION_ICONS[d.subject as DimensionType], {
                        size: isMobile ? 48 : 64,
                        color: d.color,
                        strokeWidth: 2.5,
                        style: { 
                          filter: `drop-shadow(0 0 20px ${d.color}80)` 
                        }
                      })}
                    </motion.div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </motion.svg>
    </motion.div>
  );
};
