import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, Task } from '../store/useStore';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { RefreshCcw, Loader2 } from 'lucide-react';

export const TasksOverlay: React.FC = () => {
  const isTaskPanelOpen = useStore((state) => state.isTaskPanelOpen);
  const setTaskPanelOpen = useStore((state) => state.setTaskPanelOpen);
  const setTaskToComplete = useStore((state) => state.setTaskToComplete);
  const taskToComplete = useStore((state) => state.taskToComplete);
  const dailyTasks = useStore((state) => state.dailyTasks);
  const dailyTasksLastGeneratedAt = useStore((state) => state.dailyTasksLastGeneratedAt);
  const regenerateDailyTasks = useStore((state) => state.regenerateDailyTasks);

  const [timeLeft, setTimeLeft] = React.useState<string>('24:00:00');

  React.useEffect(() => {
    if (isTaskPanelOpen && (!dailyTasksLastGeneratedAt || dailyTasks.length === 0)) {
      regenerateDailyTasks();
    }
  }, [isTaskPanelOpen, dailyTasksLastGeneratedAt, dailyTasks.length, regenerateDailyTasks]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      if (!dailyTasksLastGeneratedAt) return;

      const nextGeneration = new Date(dailyTasksLastGeneratedAt).getTime() + 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = nextGeneration - now;

      if (diff <= 0) {
        regenerateDailyTasks();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dailyTasksLastGeneratedAt, regenerateDailyTasks]);

  const handleComplete = (task: Task) => {
    setTaskToComplete(task);
  };

  return (
    <AnimatePresence>
      {isTaskPanelOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-end justify-center"
          onClick={() => setTaskPanelOpen(false)}
        >
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full max-w-2xl bg-[#0a0a12] border-t border-white/10 rounded-t-[3rem] p-8 pt-4 max-h-[90vh] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-1.5 bg-white/10 rounded-full mx-auto my-4 mb-8" />
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black neon-text italic tracking-tighter uppercase">Daily Tasks</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{dailyTasks.length} PROTOCOLS ACTIVE</p>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">RESET IN {timeLeft}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => regenerateDailyTasks()} 
                className="rounded-full bg-white/5 h-12 w-12 hover:bg-white/10 group"
              >
                <RefreshCcw className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 -mx-2 custom-scrollbar">
              <div className="space-y-5 pb-12">
                {dailyTasks.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground italic font-bold opacity-40">
                    NO DAILY PROTOCOLS ESTABLISHED.
                  </div>
                ) : (
                  dailyTasks.map((task) => (
                    <motion.div 
                      key={task.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-start gap-5 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                      <button 
                        onClick={() => handleComplete(task)} 
                        disabled={taskToComplete?.id === task.id}
                        className="mt-1 shrink-0"
                      >
                        {taskToComplete?.id === task.id ? (
                          <Loader2 className="w-7 h-7 animate-spin text-primary" />
                        ) : (
                          <div className="w-7 h-7 rounded-full border-2 border-primary/40 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 rounded-full bg-primary shadow-[0_0_10px_rgba(217,70,239,0.8)]" />
                          </div>
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{task.dimension}</span>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border",
                              task.type === 'module' 
                                ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                                : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                            )}>
                              {task.type === 'module' ? 'Module' : 'Mini-task'}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-bold">{task.subdimension}</span>
                        </div>
                        <div className="font-bold text-lg mb-1 tracking-tight">
                          {task.type === 'mini-task' ? 'Mini-task: ' : task.type === 'module' ? 'Module: ' : ''}
                          {task.title}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">{task.description}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
