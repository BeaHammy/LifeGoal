import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, Goal, GoalLog, DimensionType } from '../store/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Camera, X, Loader2, Sparkles, Zap, AlertTriangle, ArrowRight } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { cn } from '@/lib/utils';

interface LogEntryModalProps {
  goal: Goal;
  isOpen: boolean;
  onClose: () => void;
}

export const LogEntryModal: React.FC<LogEntryModalProps> = ({ goal, isOpen, onClose }) => {
  const addGoalLog = useStore((state) => state.addGoalLog);
  const moveGoalLog = useStore((state) => state.moveGoalLog);
  const goals = useStore((state) => state.goals);

  const [text, setText] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState<{ isMatch: boolean; suggestedGoalId?: string; suggestedDimension?: DimensionType } | null>(null);
  const [showCelebration, setShowCelebration] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLog = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);

    try {
      // 1. Categorize via AI
      const result = await geminiService.categorizeLog(text, goal, goals);
      
      if (!result.isMatch && (result.suggestedGoalId || result.suggestedDimension)) {
        setSuggestion(result);
        setIsProcessing(false);
        return;
      }

      await finalizeLog(goal.id);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  const finalizeLog = async (targetGoalId: string) => {
    const newLog: GoalLog = {
      id: Math.random().toString(36).substring(7),
      text,
      description,
      photo: photo || undefined,
      createdAt: new Date().toISOString(),
    };

    addGoalLog(targetGoalId, newLog);
    
    // Trigger task regeneration based on new log in background (DO NOT AWAIT)
    useStore.getState().regenerateGoalTasks(targetGoalId, text + " " + description);
    
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      onClose();
      setText('');
      setDescription('');
      setPhoto(null);
      setSuggestion(null);
      setIsProcessing(false);
    }, 1500);
  };

  const handleMove = async () => {
    if (suggestion?.suggestedGoalId) {
      await finalizeLog(suggestion.suggestedGoalId);
    } else if (suggestion?.suggestedDimension) {
      // Find the first matching goal in that dimension
      const alternativeGoal = goals.find(g => g.dimension === suggestion.suggestedDimension);
      if (alternativeGoal) {
        await finalizeLog(alternativeGoal.id);
      } else {
        // If no goal exists in that dimension, we can't really move it to a specific goal
        // For now, let's just log it here or show a message, but as per request we should "Move" it.
        // Maybe log it nowhere? No, let's keep it in current as fallback but the prompt said "move".
        await finalizeLog(goal.id);
      }
    } else {
      await finalizeLog(goal.id);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg glass-card border-none p-8 rounded-[3rem] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-primary/20 flex flex-col items-center justify-center backdrop-blur-md"
            >
              <Zap className="w-16 h-16 text-white animate-bounce" />
              <h2 className="text-xl font-black italic tracking-tighter uppercase text-white mt-4">Log Synchronized</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">+1 Energy Point</span>
            </motion.div>
          )}

          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Neural Logging</span>
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{goal.title}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-white/5 h-10 w-10">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {suggestion ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 space-y-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-400">Context Mismatch Detected</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      AI analysis suggests this log might better align with: 
                      <span className="text-white font-bold ml-1">
                        {suggestion.suggestedGoalId 
                          ? goals.find(g => g.id === suggestion.suggestedGoalId)?.title 
                          : suggestion.suggestedDimension}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest"
                    onClick={() => finalizeLog(goal.id)}
                  >
                    Keep Here
                  </Button>
                  <Button 
                    className="flex-1 h-12 rounded-2xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    onClick={handleMove}
                  >
                    Move Log
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Protocol Title</Label>
                  <Input
                    placeholder="DEFINE THE SYNC EVENT..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-sm font-bold focus:border-primary/50 transition-all py-4"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Visual Log & Narrative</Label>
                  <div className="flex gap-4 h-40">
                    <textarea
                      placeholder="DESCRIBE THE EVOLUTION OR INSIGHT..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-[2rem] p-5 text-sm font-medium focus:border-primary/50 transition-all resize-none outline-none custom-scrollbar"
                    />
                    
                    <div 
                      onClick={() => !isProcessing && fileInputRef.current?.click()}
                      className={cn(
                        "relative w-40 h-full rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 group shrink-0",
                        photo ? "border-primary/50 bg-primary/5" : "border-white/10 bg-white/5 hover:border-primary/30 hover:bg-white/10"
                      )}
                    >
                      {photo ? (
                        <>
                          <img src={photo} alt="Attachment" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-white px-2 text-center">Capture Reality</span>
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
                  onClick={handleLog}
                  disabled={isProcessing || !text.trim()}
                  className="w-full h-16 rounded-[2rem] bg-primary text-black font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-current" />
                      Sync Log
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
