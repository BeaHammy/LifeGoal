import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, Task } from '../store/useStore';
import { Button } from './ui/button';
import { Camera, Image as ImageIcon, X, Loader2, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';

export const TaskCompletionFlow: React.FC = () => {
  const taskToComplete = useStore((state) => state.taskToComplete);
  const setTaskToComplete = useStore((state) => state.setTaskToComplete);
  const completeTask = useStore((state) => state.completeTask);
  const goals = useStore((state) => state.goals);
  const completedTasks = useStore((state) => state.completedTasks);
  const addTaskToGoal = useStore((state) => state.addTaskToGoal);

  const [photo, setPhoto] = React.useState<string | null>(null);
  const [completionNote, setCompletionNote] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showCelebration, setShowCelebration] = React.useState(false);
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!taskToComplete) {
      setShowFullDescription(false);
    }
  }, [taskToComplete]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalize = async () => {
    if (!taskToComplete) return;
    setIsProcessing(true);

    try {
      // Get latest state for goals to find the owner goal
      const currentGoals = useStore.getState().goals;
      const goal = currentGoals.find(g => g.tasks.some(t => t.id === taskToComplete.id));

      // 1. Complete task in store
      completeTask(taskToComplete.id, photo || undefined);

      // If they provided a note, we add it as a log entry
      if (completionNote.trim() && goal) {
        useStore.getState().addGoalLog(goal.id, {
          id: Math.random().toString(36).substring(7),
          text: `Protocol Sync: ${taskToComplete.title}`,
          description: completionNote,
          photo: photo || undefined,
          createdAt: new Date().toISOString()
        });
      }

      // 2. Trigger celebration
      setShowCelebration(true);
      
      // 3. Generate next tasks in background (DO NOT AWAIT)
      if (goal) {
        useStore.getState().regenerateGoalTasks(goal.id, completionNote);
      }

      // 4. Wait for celebration then close
      setTimeout(() => {
        setShowCelebration(false);
        setTaskToComplete(null);
        setPhoto(null);
        setCompletionNote('');
        setIsProcessing(false);
      }, 800); // Reduced delay for snappier feel

    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  if (!taskToComplete) return null;

  return (
    <AnimatePresence>
      {taskToComplete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={() => !isProcessing && setTaskToComplete(null)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg glass-card border-none p-8 rounded-[3rem] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Celebration Overlay */}
            <AnimatePresence>
              {showCelebration && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-primary/20 flex flex-col items-center justify-center backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-primary blur-[40px] opacity-50 animate-pulse" />
                    <CheckCircle2 className="w-24 h-24 text-white relative z-10" />
                  </motion.div>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 text-center"
                  >
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Protocol Synchronized</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-2">Evolution in progress</p>
                  </motion.div>
                  
                  {/* Aurora Shimmer Effect */}
                  <motion.div
                    animate={{
                      x: ['-100%', '100%'],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Finalize Protocol</span>
                  </div>
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{taskToComplete.title}</h2>
                </div>
                {!isProcessing && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setTaskToComplete(null)}
                    className="rounded-full bg-white/5 h-10 w-10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className={cn(
                    "text-sm text-muted-foreground leading-relaxed font-medium italic transition-all",
                    !showFullDescription && "line-clamp-2"
                  )}>
                    {taskToComplete.description}
                  </p>
                  {taskToComplete.description.length > 80 && (
                    <button 
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors cursor-pointer"
                    >
                      {showFullDescription ? "Show Less" : "Show All"}
                    </button>
                  )}
                </div>

                {/* Photo Attachment Section */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Synthesis Transcript (Optional)</span>
                    </div>
                    <textarea 
                      placeholder="DESCRIBE THE OUTCOME OR INSIGHT..."
                      value={completionNote}
                      onChange={(e) => setCompletionNote(e.target.value)}
                      className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-primary/50 transition-all outline-none resize-none no-scrollbar"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Camera className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Visual Proof (Optional)</span>
                    </div>
                    <div 
                      onClick={() => !isProcessing && fileInputRef.current?.click()}
                      className={cn(
                        "relative h-40 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3 group",
                        photo ? "border-primary/50 bg-primary/5" : "border-white/10 bg-white/5 hover:border-primary/30 hover:bg-white/10"
                      )}
                    >
                    {photo ? (
                      <>
                        <img src={photo} alt="Attachment" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-8 h-8 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white">Tap to capture proof</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                </div>
              </div>

                <Button
                  onClick={handleFinalize}
                  disabled={isProcessing}
                  className="w-full h-16 rounded-[2rem] bg-primary text-black font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-current" />
                      Complete Protocol
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Background Glow */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
