import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from './components/ui/sidebar';
import { Sidebar } from './components/Sidebar';
import { AuroraBackground } from './components/AuroraBackground';
import { Dashboard } from './pages/Dashboard';
import { DimensionDetail } from './pages/DimensionDetail';
import { StatsAchievements } from './pages/StatsAchievements';
import { Settings } from './pages/Settings';
import { TooltipProvider } from './components/ui/tooltip';
import { useStore } from './store/useStore';
import { MenuOrb } from './components/MenuOrb';
import { ChatDock } from './components/ChatDock';
import { TasksOverlay } from './components/TasksOverlay';
import { TaskCompletionFlow } from './components/TaskCompletionFlow';
import { useLocation } from 'react-router-dom';

const AppContent: React.FC = () => {
  const location = useLocation();
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="relative flex h-screen w-full overflow-hidden">
          <AuroraBackground />
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <main className="flex-1 relative overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stats" element={<StatsAchievements />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/dimension/:name" element={<DimensionDetail />} />
            </Routes>
          </main>
          <ChatDock />
          {location.pathname !== '/' && <MenuOrb />}
          <TasksOverlay />
          <TaskCompletionFlow />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

