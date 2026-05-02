import React from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Archive, 
  Settings, 
  Zap,
  ChevronRight,
  Trophy
} from 'lucide-react';
import { 
  Sidebar as ShadcnSidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger
} from './ui/sidebar';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const activeGoalsCount = useStore((state) => state.goals.filter(g => g.active).length);
  const finishedTasksCount = useStore((state) => state.completedTasks.length);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Trophy, label: 'Insights', path: '/stats' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <ShadcnSidebar className="border-r border-white/10 bg-black/40 backdrop-blur-3xl">
      <SidebarHeader className="p-8">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center neon-glow group-hover:scale-110 transition-transform duration-500">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter neon-text leading-none">AURORA</span>
            <div className="flex flex-col mt-0.5">
              <span className="text-[7px] uppercase tracking-[0.2em] text-muted-foreground font-bold leading-tight">{activeGoalsCount} ACTIVE GOALS</span>
              <span className="text-[7px] uppercase tracking-[0.2em] text-primary font-black leading-tight">{finishedTasksCount} TASKS SYNCED</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarMenu className="gap-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton 
                isActive={location.pathname === item.path}
                render={
                  <Link 
                    to={item.path} 
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                      location.pathname === item.path 
                        ? "bg-primary/20 text-primary shadow-[inset_0_0_20px_rgba(217,70,239,0.1)]" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-transform duration-500 group-hover:scale-110",
                      location.pathname === item.path && "animate-pulse"
                    )} />
                    <span className="font-bold tracking-tight">{item.label}</span>
                    {location.pathname === item.path && (
                      <motion.div 
                        layoutId="active-pill"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary neon-glow"
                      />
                    )}
                  </Link>
                }
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-8">
        {/* Empty space as requested */}
      </SidebarFooter>
    </ShadcnSidebar>
  );
};
