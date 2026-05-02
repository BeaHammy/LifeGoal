import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, DimensionType, Goal } from '../store/useStore';
import { geminiService } from '../services/geminiService';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Target, Zap, Loader2, Sparkles, Circle, RefreshCcw, Trophy, MessageSquare, ListTodo, MoreHorizontal, ScrollText, Flame, Calendar, CheckSquare, Triangle, Briefcase, Users, Palette, Activity, Coins } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { LogEntryModal } from '../components/LogEntryModal';
import { SharedRadar } from '../components/SharedRadar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const COLORS = ['#a855f7', '#d946ef', '#22d3ee', '#10b981', '#f59e0b', '#ef4444'];

const DIMENSION_ICONS: Record<DimensionType, React.ElementType> = {
  'Work & Learning': Briefcase,
  'Social': Users,
  'Hobby & Creativity': Palette,
  'Health & Wellness': Activity,
  'Finance': Coins,
  'Everyday Activities': Zap
};

export const DimensionDetail: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [isDeploying, setIsDeploying] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newGoalTitle, setNewGoalTitle] = React.useState('');
  const [newGoalSummary, setNewGoalSummary] = React.useState('');
  const [newGoalContext, setNewGoalContext] = React.useState({ objective: '', outcome: '', limitations: '', extraInfo: '' });
  const [isConversing, setIsConversing] = React.useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [isRefining, setIsRefining] = React.useState(false);
  const [conversationalAnswers, setConversationalAnswers] = React.useState(['', '', '', '', '']);
  const [inappropriateCount, setInappropriateCount] = React.useState(0);
  const [showSafetyWarning, setShowSafetyWarning] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editSummary, setEditSummary] = React.useState('');

  const decodedName = decodeURIComponent(name || '') as DimensionType;
  const dimensions = useStore((state) => state.dimensions);
  const dimension = dimensions[decodedName];
  
  const dimensionKeys = React.useMemo(() => Object.keys(dimensions) as DimensionType[], [dimensions]);
  const dimensionIndex = dimensionKeys.indexOf(decodedName);
  const dimensionColor = COLORS[dimensionIndex % COLORS.length];

  const baseRotation = -dimensionIndex * 60;
  const dragX = useMotionValue(0);
  const dragRotation = useTransform(dragX, [-300, 300], [60, -60]);
  const constellationRotation = useTransform(dragRotation, (v) => v + baseRotation);
  const rotateValue = useSpring(constellationRotation, { damping: 25, stiffness: 150 });
  const constellationOpacity = useTransform(dragX, [-200, -50, 0, 50, 200], [0.5, 0.8, 1, 0.8, 0.5]);

  const handlePrevDimension = () => {
    const prevIndex = (dimensionIndex - 1 + dimensionKeys.length) % dimensionKeys.length;
    navigate(`/dimension/${encodeURIComponent(dimensionKeys[prevIndex])}`);
  };

  const handleNextDimension = () => {
    const nextIndex = (dimensionIndex + 1) % dimensionKeys.length;
    navigate(`/dimension/${encodeURIComponent(dimensionKeys[nextIndex])}`);
  };

  const allGoals = useStore((state) => state.goals);
  const goals = React.useMemo(() => allGoals.filter(g => g.dimension === decodedName), [allGoals, decodedName]);
  const activeGoals = React.useMemo(() => goals.filter(g => g.active), [goals]);
  const inactiveGoals = React.useMemo(() => goals.filter(g => !g.active), [goals]);

  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  React.useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const deployGoal = useStore((state) => state.deployGoal);
  const deleteGoal = useStore((state) => state.deleteGoal);
  const toggleGoalActive = useStore((state) => state.toggleGoalActive);
  const updateGoal = useStore((state) => state.updateGoal);
  const addGoal = useStore((state) => state.addGoal);
  const reloadTask = useStore((state) => state.reloadTask);
  const reloadCount = useStore((state) => state.reloadCount);
  const addTaskToGoal = useStore((state) => state.addTaskToGoal);
  const completedTasks = useStore((state) => state.completedTasks);

  const [isLogModalOpen, setIsLogModalOpen] = React.useState(false);
  const [activeLogGoal, setActiveLogGoal] = React.useState<any | null>(null);
  const [expandedTaskId, setExpandedTaskId] = React.useState<string | null>(null);

  const setTaskToComplete = useStore((state) => state.setTaskToComplete);

  const handleReloadTask = async (task: any) => {
    if (reloadCount >= 3) return;
    try {
      const goal = goals.find(g => g.dimension === task.dimension && g.subdimension === task.subdimension);
      if (!goal) return;
      
      const { miniTask, module } = await geminiService.generateTasks(goal);
      const newTask = task.type === 'mini-task' ? miniTask : module;
      reloadTask(task.id, newTask);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const currentGoalTitles = goals.map(g => g.title);
      const suggested = await geminiService.suggestGoals(decodedName, currentGoalTitles);
      setSuggestions(suggested);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleCreateGoal = async (title: string, summary?: string, context?: Goal['context'], experienceLevel?: Goal['experienceLevel']) => {
    if (!title.trim()) return;
    
    const goalId = Math.random().toString(36).substr(2, 9);
    const newGoal: Goal = {
      id: goalId,
      title: title,
      dimension: decodedName,
      subdimension: title,
      deployed: false,
      active: true,
      createdAt: new Date().toISOString(),
      tasks: [],
      competences: [],
      completedModules: [],
      experienceLevel,
      summary,
      context
    };

    addGoal(newGoal);
    setNewGoalTitle('');
    setNewGoalSummary('');
    setNewGoalContext({ objective: '', outcome: '', limitations: '', extraInfo: '' });
    setConversationalAnswers(['', '', '', '', '']);
    setIsConversing(false);
    setCurrentQuestionIndex(0);
    setIsDialogOpen(false);

    // Auto-deploy
    setIsDeploying(goalId);
    try {
      await useStore.getState().regenerateGoalTasks(goalId);
      deployGoal(goalId, useStore.getState().goals.find(g => g.id === goalId)?.tasks || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeploying(null);
    }
  };

  const handleDeploy = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    
    setIsDeploying(goalId);
    try {
      await useStore.getState().regenerateGoalTasks(goalId);
      deployGoal(goalId, useStore.getState().goals.find(g => g.id === goalId)?.tasks || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeploying(null);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditSummary(goal.summary || '');
    setIsEditDialogOpen(true);
  };

  const onUpdateGoal = () => {
    if (!editingGoal || !editTitle.trim()) return;
    updateGoal(editingGoal.id, {
      title: editTitle,
      summary: editSummary
    });
    setIsEditDialogOpen(false);
    setEditingGoal(null);
  };

  const conversationalQuestions = [
    { question: "What is the Life Goal you want to achieve?", key: 'objective' },
    { question: "How will you recognize you achieved the goal?", key: 'outcome' },
    { question: "What’s stopping you right now? (Include any limitations you might have)", key: 'limitations' },
    { question: "Where do you currently stand with this Life Goal?", key: 'experienceLevel' },
    { question: "Is there anything else you'd like to share? The more depth you provide about your vision or current setup, the more precisely your developmental path can be tailored.", key: 'extraInfo' }
  ];

  const handleConversationalAnswer = async (answer: string) => {
    // Safety & Quality Filters
    const unsafePatterns = [
      /fuck|shit|asshole|bitch|bastard/i, // common vulgarity
      /hateful|aggressive|illegal|dangerous|sexual|trollish/i, // placeholder for broader checks
    ];
    
    const isMeaningless = answer.trim().length < 3 || /^[a-z]{3,}$/i.test(answer) && !/^[aeiouy]/i.test(answer) && !/[aeiouy]/i.test(answer); // e.g. "kfkfk"
    const isTrollish = /learning to poop/i.test(answer);
    
    const isUnsafe = unsafePatterns.some(p => p.test(answer)) || isMeaningless || isTrollish;

    if (isUnsafe && currentQuestionIndex === 0) {
      if (inappropriateCount >= 1) {
        setShowSafetyWarning("This goal cannot be used. Please choose a different one.");
        return;
      }
      setInappropriateCount(prev => prev + 1);
      setShowSafetyWarning("I need a clear and constructive Life Goal to support you. Could you rephrase it?");
      return;
    }

    setShowSafetyWarning(null);
    const newAnswers = [...conversationalAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setConversationalAnswers(newAnswers);

    if (currentQuestionIndex < conversationalQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Flow finished
      setIsRefining(true);
      try {
        const context = {
          objective: newAnswers[0],
          outcome: newAnswers[1],
          limitations: newAnswers[2],
          experienceLevel: newAnswers[3],
          extraInfo: newAnswers[4]
        };
        const level = newAnswers[3] as Goal['experienceLevel'];
        const refined = await geminiService.refineGoal({ 
          objective: context.objective,
          outcome: context.outcome,
          limitations: context.limitations,
          extraInfo: context.extraInfo,
          experienceLevel: level 
        });
        setNewGoalTitle(refined.name);
        setNewGoalSummary(refined.summary);
        setNewGoalContext({
          objective: context.objective,
          outcome: context.outcome,
          limitations: context.limitations,
          extraInfo: context.extraInfo
        });
        setIsConversing(false);
      } catch (error) {
        console.error(error);
      } finally {
        setIsRefining(false);
      }
    }
  };

  if (!dimension) return <div>Dimension not found</div>;

  return (
    <div className="p-2 md:p-8 space-y-4 md:space-y-8 max-w-6xl mx-auto overflow-y-auto no-scrollbar pb-32 md:pb-8 relative">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between px-4 mb-2 md:mb-6 relative z-30">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
          style={{ '--dim-color': dimensionColor } as any}
        >
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/')} 
            className="rounded-full bg-white/5 border border-white/10 transition-all flex items-center gap-2 group hover:bg-[var(--dim-color)]/20 hover:text-[var(--dim-color)] px-4 py-2 h-auto"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Constellation</span>
          </Button>
        </motion.div>
      </div>

      {/* Main Dimension Carousel - Drag Swiping */}
      <header className="relative w-full py-2 group/carousel overflow-visible">
        {/* Constellation Arc Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110%] pointer-events-none z-0 h-[180px] md:h-[280px] overflow-hidden">
          <motion.div 
            className="w-full h-full flex items-center justify-center relative -top-1/4"
            style={{ opacity: constellationOpacity }}
          >
             <SharedRadar 
               activeDimension={decodedName}
               isHeader={true}
               rotationOffset={rotateValue}
               className="w-[500px] md:w-[800px]"
             />
          </motion.div>
        </div>

        {/* Navigation Arrows */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center">
          <motion.div animate={{ x: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <Button variant="ghost" size="icon" onClick={handlePrevDimension} className="pointer-events-auto rounded-full bg-black/60 backdrop-blur-md h-10 w-10 border border-white/20 hover:border-white/40 transition-all ml-4">
              <Triangle className="w-5 h-5 -rotate-90 fill-current" style={{ color: dimensionColor }} />
            </Button>
          </motion.div>
        </div>

        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center">
          <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <Button variant="ghost" size="icon" onClick={handleNextDimension} className="pointer-events-auto rounded-full bg-black/60 backdrop-blur-md h-10 w-10 border border-white/20 hover:border-white/40 transition-all mr-4">
              <Triangle className="w-5 h-5 rotate-90 fill-current" style={{ color: dimensionColor }} />
            </Button>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto px-[10vw]">
          <AnimatePresence mode="wait">
            <motion.div 
              key={decodedName}
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -50 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag={isTouchDevice ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              style={{ x: dragX }}
              onDragEnd={(_, info) => {
                if (!isTouchDevice) return;
                const threshold = 100;
                if (info.offset.x > threshold) handleNextDimension();
                else if (info.offset.x < -threshold) handlePrevDimension();
                if (Math.abs(info.offset.x) <= threshold) dragX.set(0);
              }}
              className={cn("touch-none select-none group", isTouchDevice ? "cursor-grab active:cursor-grabbing" : "cursor-default")}
            >
                <div className="relative z-10 py-4 md:py-8 mt-4 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.2 }}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl relative"
                    style={{ 
                      backgroundColor: `${dimensionColor}15`,
                      border: `1px solid ${dimensionColor}30`,
                      boxShadow: `0 0 30px ${dimensionColor}10`
                    }}
                  >
                    <div className="absolute inset-0 blur-2xl opacity-10 bg-current rounded-full" style={{ color: dimensionColor }} />
                    {React.createElement(DIMENSION_ICONS[decodedName], {
                      size: isMobile ? 24 : 32,
                      color: dimensionColor,
                      strokeWidth: 2,
                      style: { filter: `drop-shadow(0 0 10px ${dimensionColor})` }
                    })}
                  </motion.div>
                  
                  <motion.h1 
                    layoutId={`label-${decodedName}`}
                    className="text-2xl md:text-4xl font-black tracking-widest italic uppercase leading-none text-center md:text-left"
                    style={{ 
                      color: dimensionColor,
                      textShadow: `0 0 20px ${dimensionColor}90, 0 8px 10px rgba(0,0,0,0.5)`
                    }}
                  >
                    {dimension.name}
                  </motion.h1>
                </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2.5 mt-6">
          {dimensionKeys.map((key, index) => (
            <button key={key} onClick={() => navigate(`/dimension/${encodeURIComponent(key)}`)} className={cn("h-2 transition-all duration-500 rounded-full", key === decodedName ? "w-10" : "w-2 bg-white/20")} style={{ backgroundColor: key === decodedName ? COLORS[index % COLORS.length] : undefined }} />
          ))}
        </div>
      </header>

      {/* Goal Content Section */}
      <div className="space-y-8 max-w-4xl mx-auto pb-12">
        {/* Active Goals Section */}
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">Active Protocols</h2>
            <div className="h-[1px] flex-1 mx-6 bg-gradient-to-r from-white/10 to-transparent" style={{ backgroundImage: `linear-gradient(to right, ${dimensionColor}30, transparent)` }} />
          </div>
          
          <div className="space-y-4 px-2 md:px-0">
            {activeGoals.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-16 text-center glass-card rounded-[2.5rem] text-muted-foreground font-bold italic opacity-40 border-dashed border-2 border-white/5">
                NO ACTIVE PROTOCOLS.
              </motion.div>
            ) : (
              activeGoals.map((goal, gIndex) => {
                const isExpanded = activeLogGoal?.id === goal.id;
                return (
                  <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gIndex * 0.05 }} className="group" style={{ '--dim-color': dimensionColor } as any}>
                    <Card 
                      className={cn(
                        "glass-card border-none overflow-hidden rounded-3xl transition-all duration-500 relative cursor-pointer",
                        "hover:bg-white/10"
                      )}
                      onClick={() => setActiveLogGoal(activeLogGoal?.id === goal.id ? null : goal)}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `linear-gradient(to right, transparent, ${dimensionColor}, transparent)` }} />
                      
                      <div className="p-4 md:p-6">
                        {isDeploying === goal.id && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--dim-color)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--dim-color)]">Syncing Neural Path...</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border" style={{ backgroundColor: `${dimensionColor}10`, borderColor: `${dimensionColor}20` }}>
                              <Target className="w-5 h-5 md:w-6 md:h-6" style={{ color: dimensionColor }} />
                            </div>
                            <div>
                              <CardTitle className="text-base md:text-lg font-black italic tracking-tighter uppercase transition-colors group-hover:text-[var(--dim-color)]">{goal.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[7px] border-white/5 uppercase tracking-widest opacity-50 px-1.5 h-auto">{goal.subdimension}</Badge>
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                                  <div className="w-1 h-1 rounded-full animate-pulse bg-primary" />
                                  <span className="text-[6px] font-black uppercase tracking-widest text-primary">Active</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 md:gap-4">
                            {!isExpanded && (
                              <div className="hidden md:flex items-center gap-4 border-r border-white/10 pr-4 mr-2">
                                <div className="text-center">
                                  <div className="text-[10px] font-black italic">5</div>
                                  <div className="text-[6px] text-muted-foreground uppercase font-bold tracking-widest">Streak</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-[10px] font-black italic">12</div>
                                  <div className="text-[6px] text-muted-foreground uppercase font-bold tracking-widest">Done</div>
                                </div>
                              </div>
                            )}
  
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button>} />
                                <DropdownMenuContent align="end" className="glass-card border-white/10 text-white rounded-xl">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditGoal(goal); }} className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20 focus:text-primary cursor-pointer">Edit Life Goal</DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleGoalActive(goal.id); }} className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20 focus:text-primary cursor-pointer">Move to Inactive Goals</DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }} className="text-[10px] font-black uppercase tracking-widest focus:bg-red-500/20 focus:text-red-400 cursor-pointer text-red-400/80">Delete Goal</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                                <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                              </motion.div>
                            </div>
                          </div>
                        </div>
  
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
                              <div className="pt-6 md:pt-8 space-y-6 md:space-y-8">
                                 <div className="grid grid-cols-3 gap-3 md:gap-4">
                                  <div className="text-center p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1.5" />
                                    <div className="text-base md:text-xl font-black italic">5</div>
                                    <div className="text-[7px] md:text-[8px] text-muted-foreground uppercase tracking-widest">Current Streak</div>
                                  </div>
                                  <div className="text-center p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <CheckSquare className="w-4 h-4 text-accent mx-auto mb-1.5" />
                                    <div className="text-base md:text-xl font-black italic">12</div>
                                    <div className="text-[7px] md:text-[8px] text-muted-foreground uppercase tracking-widest">Tasks Done</div>
                                  </div>
                                  <div className="text-center p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 group/log" onClick={() => setIsLogModalOpen(true)}>
                                    <ScrollText className="w-4 h-4 mx-auto mb-1.5 transition-transform group-hover/log:scale-110" style={{ color: dimensionColor }} />
                                    <div className="text-[7px] md:text-[8px] font-black uppercase tracking-widest" style={{ color: dimensionColor }}>Journal Entries</div>
                                  </div>
                                </div>
  
                                    <div className="space-y-6">
                                      <div className="flex items-center gap-2 mb-2 px-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-cyan-400/70">Neural Path Protocols</span>
                                      </div>
                                      
                                      {/* Logic to only show 1 of each type */}
                                      {(() => {
                                        const miniTask = goal.tasks.find(t => t.type === 'mini-task');
                                        const moduleTask = goal.tasks.find(t => t.type === 'module');
                                        
                                        return [...(miniTask ? [miniTask] : []), ...(moduleTask ? [moduleTask] : [])].map((task) => (
                                          <div key={task.id} className="space-y-2">
                                            <div className="flex items-center gap-2 px-1">
                                              <span className={cn(
                                                "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border",
                                                task.type === 'module' 
                                                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]" 
                                                  : "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                                              )}>
                                                {task.type === 'module' ? 'Module' : 'Mini-task'}
                                              </span>
                                              {task.type === 'module' && <Sparkles className="w-2.5 h-2.5 text-purple-400 animate-pulse" />}
                                              {task.type === 'mini-task' && <Zap className="w-2.5 h-2.5 text-cyan-400" />}
                                            </div>
                                            <div 
                                              className={cn(
                                                "p-4 md:p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group/task cursor-pointer",
                                                task.type === 'module'
                                                  ? "bg-purple-500/5 border-purple-500/10 hover:bg-purple-500/10 hover:border-purple-500/20"
                                                  : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                                              )}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedTaskId(expandedTaskId === task.id ? null : task.id);
                                              }}
                                            >
                                          <div className="flex items-center gap-4">
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setTaskToComplete(task);
                                                }} 
                                                className="text-muted-foreground hover:scale-110 transition-all"
                                              >
                                                <div className="w-5 h-5 rounded-full border-2 border-white/20 flex items-center justify-center group-hover/task:border-[var(--dim-color)]"><Circle className="w-2.5 h-2.5 opacity-0 group-hover/task:opacity-100" style={{ color: dimensionColor }} /></div>
                                              </button>
                                            <div className="font-bold text-sm md:text-base group-hover/task:text-[var(--dim-color)] transition-colors">
                                              {task.type === 'mini-task' ? 'Mini-task: ' : task.type === 'module' ? 'Module: ' : ''}
                                              {task.title}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover/task:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); handleReloadTask(task); }}><RefreshCcw className="w-3 h-3" /></Button>
                                            <motion.div animate={{ rotate: expandedTaskId === task.id ? 90 : 0 }} className="text-muted-foreground/30">
                                              <ChevronRight className="w-4 h-4" />
                                            </motion.div>
                                          </div>
                                        </div>
                                        <AnimatePresence>
                                          {expandedTaskId === task.id && (
                                            <motion.div 
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="px-14 py-3 text-xs text-muted-foreground italic leading-relaxed border-l-2 ml-6 mb-2" style={{ borderColor: dimensionColor }}>
                                                {task.description}
                                              </div>
                                            </motion.div>
                                          )}
                                          </AnimatePresence>
                                        </div>
                                      ))
                                    })()}
                                  </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Inactive Goals Section */}
        {inactiveGoals.length > 0 && (
          <div className="space-y-4 md:space-y-6 pt-8">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 italic">Inactive Protocols</h2>
              <div className="h-[1px] flex-1 mx-6 bg-gradient-to-r from-white/10 to-transparent" style={{ backgroundImage: `linear-gradient(to right, ${dimensionColor}20, transparent)` }} />
            </div>

            <div className="space-y-4 px-2 md:px-0">
              {inactiveGoals.map((goal, gIndex) => {
                const isExpanded = activeLogGoal?.id === goal.id;
                return (
                  <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gIndex * 0.05 }} className="group" style={{ '--dim-color': dimensionColor } as any}>
                    <Card 
                      className={cn(
                        "glass-card border-none overflow-hidden rounded-3xl transition-all duration-500 relative cursor-pointer",
                        "opacity-50 grayscale-[0.8] hover:opacity-100 hover:grayscale-0",
                        "hover:bg-white/10"
                      )}
                      onClick={() => setActiveLogGoal(activeLogGoal?.id === goal.id ? null : goal)}
                    >
                      <div className="p-4 md:p-6">
                        {isDeploying === goal.id && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-[var(--dim-color)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--dim-color)]">Reactivating Protocol...</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border bg-white/5 border-white/10">
                              <Target className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <CardTitle className="text-base md:text-lg font-black italic tracking-tighter uppercase text-muted-foreground group-hover:text-white">{goal.title}</CardTitle>
                              <Badge variant="outline" className="text-[7px] border-white/5 uppercase tracking-widest opacity-30 mt-1 px-1.5 h-auto">{goal.subdimension}</Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 md:gap-4">
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-4 h-4" /></Button>} />
                                <DropdownMenuContent align="end" className="glass-card border-white/10 text-white rounded-xl">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditGoal(goal); }} className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20 focus:text-primary cursor-pointer">Edit Life Goal</DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleGoalActive(goal.id); }} className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/20 focus:text-primary cursor-pointer">Move to Active Goals</DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }} className="text-[10px] font-black uppercase tracking-widest focus:bg-red-500/20 focus:text-red-400 cursor-pointer text-red-400/80">Delete Goal</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                                <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden" onClick={(e) => e.stopPropagation()}>
                              <div className="pt-6 md:pt-8">
                                <div className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Neural Protocol is currently offline</p>
                                  <Button 
                                    className="h-12 px-6 rounded-xl bg-white/5 hover:bg-white/10 border transition-all font-black uppercase tracking-widest text-[9px]" 
                                    variant="ghost" 
                                    onClick={() => handleDeploy(goal.id)} 
                                    disabled={isDeploying === goal.id} 
                                    style={{ borderColor: `${dimensionColor}30`, color: dimensionColor }}
                                  >
                                    {isDeploying === goal.id ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <Zap className="w-4 h-4 mr-3" />} Reactivate Protocol
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center py-6">
        <Dialog open={isDialogOpen} onOpenChange={(v) => {
          setIsDialogOpen(v);
          if (!v) {
            setIsConversing(false);
            setCurrentQuestionIndex(0);
            setConversationalAnswers(['', '', '', '', '']);
            setInappropriateCount(0);
            setShowSafetyWarning(null);
          }
        }}>
          <DialogTrigger render={<Button className="h-14 px-8 rounded-2xl text-black font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 group" onClick={fetchSuggestions} style={{ backgroundColor: dimensionColor, boxShadow: `0 0 30px ${dimensionColor}40` }}><Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" /> Create New Life Goal</Button>} />
          <DialogContent className="glass-card border-white/10 bg-[#0a0a12]/95 backdrop-blur-xl rounded-[2.5rem] p-8">
            <AnimatePresence mode="wait">
              {isConversing ? (
                <motion.div 
                  key="conversational-flow"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8 py-6"
                >
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black italic tracking-tighter neon-text uppercase leading-tight">
                      Step {currentQuestionIndex + 1}: <span className="text-white opacity-60">Neural Setup</span>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    {currentQuestionIndex === 0 && (
                      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                        <p className="text-sm font-bold text-primary italic leading-relaxed">
                          Great! Let’s create your Life Goal together.
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <Label className="text-sm font-bold text-primary italic">
                        {conversationalQuestions[currentQuestionIndex].question}
                      </Label>
                      
                      {showSafetyWarning && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest"
                        >
                          {showSafetyWarning}
                        </motion.div>
                      )}
                      
                      {currentQuestionIndex === 3 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {["Just starting", "Making progress", "Confident but refining"].map((level) => (
                            <Button 
                              key={level}
                              onClick={() => handleConversationalAnswer(level)}
                              variant="outline"
                              className={cn(
                                "h-14 rounded-xl border-white/10 font-bold justify-start px-6 hover:bg-primary/20 hover:text-primary transition-all",
                                conversationalAnswers[3] === level && "border-primary bg-primary/10 text-primary"
                              )}
                            >
                              {level}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            autoFocus
                            placeholder="Type your response..."
                            value={conversationalAnswers[currentQuestionIndex]}
                            onChange={(e) => {
                              const newAns = [...conversationalAnswers];
                              newAns[currentQuestionIndex] = e.target.value;
                              setConversationalAnswers(newAns);
                              if (showSafetyWarning) setShowSafetyWarning(null);
                            }}
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-primary/50 transition-all outline-none resize-none no-scrollbar"
                          />
                          {currentQuestionIndex === 4 && (
                            <Button
                              variant="ghost"
                              onClick={() => handleConversationalAnswer("No additional context")}
                              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
                            >
                              Skip
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <Button 
                        variant="ghost" 
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        className="h-12 px-6 rounded-xl border border-white/10 font-bold uppercase tracking-widest text-[10px]"
                      >
                        Back
                      </Button>
                      {currentQuestionIndex !== 3 && (
                        <Button 
                          disabled={(!conversationalAnswers[currentQuestionIndex]?.trim() && currentQuestionIndex !== 4) || isRefining}
                          onClick={() => handleConversationalAnswer(conversationalAnswers[currentQuestionIndex])}
                          className="h-12 px-8 rounded-xl text-black font-black uppercase tracking-widest text-[10px]"
                          style={{ backgroundColor: dimensionColor }}
                        >
                          {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : currentQuestionIndex === 4 ? "Finalize" : "Next Segment"}
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {conversationalQuestions.map((_, i) => (
                        <div key={i} className={cn("h-1 flex-1 rounded-full bg-white/10 transition-all", i <= currentQuestionIndex && "bg-primary")} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="manual-form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <DialogHeader><DialogTitle className="text-3xl font-black italic tracking-tighter neon-text uppercase">Create New Life Goal</DialogTitle></DialogHeader>
                  <div className="space-y-8 py-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Protocol Designation</Label>
                      <div className="relative group">
                        <Input 
                          placeholder="ENTER DESIGNATION..." 
                          value={newGoalTitle} 
                          readOnly
                          onClick={() => setIsConversing(true)}
                          className="h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-sm font-bold focus:border-primary/50 transition-all cursor-pointer group-hover:bg-white/10" 
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Neural Flow</span>
                        </div>
                      </div>
                      {newGoalSummary && (
                        <div className="mt-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
                          <p className="text-[10px] font-bold text-primary/80 italic leading-relaxed">"{newGoalSummary}"</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Neural Suggestions</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {isLoadingSuggestions ? <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 animate-pulse"><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-[10px] font-black uppercase tracking-widest opacity-50">Analyzing Sector...</span></div> : suggestions.map((suggestion, i) => (<button key={i} onClick={() => setNewGoalTitle(suggestion)} className="text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all group"><div className="text-xs font-bold group-hover:text-primary transition-colors">{suggestion}</div></button>))}
                      </div>
                    </div>
                    <Button className="w-full h-14 rounded-2xl text-black font-black uppercase tracking-widest text-xs transition-all" onClick={() => handleCreateGoal(newGoalTitle, newGoalSummary, newGoalContext, conversationalAnswers[3] as any)} disabled={!newGoalTitle.trim() || isDeploying !== null} style={{ backgroundColor: dimensionColor, boxShadow: `0 0 20px ${dimensionColor}40` }}>{isDeploying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Protocol"}</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>

      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 pointer-events-none">
        <div className="text-[8px] font-black uppercase tracking-[0.4em] text-primary/20 rotate-90 origin-bottom-right translate-x-4 md:translate-x-6">Neural Link</div>
      </div>

      {activeLogGoal && (
        <LogEntryModal goal={activeLogGoal} isOpen={isLogModalOpen} onClose={() => { setIsLogModalOpen(false); setActiveLogGoal(null); }} />
      )}

      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="glass-card border-white/10 bg-[#0a0a12]/95 backdrop-blur-xl rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic tracking-tighter neon-text uppercase">Edit Life Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Title</Label>
              <Input 
                placeholder="GOAL TITLE..." 
                value={editTitle} 
                onChange={(e) => setEditTitle(e.target.value)} 
                className="h-14 bg-white/5 border-white/10 rounded-2xl px-6 text-sm font-bold focus:border-primary/50 transition-all" 
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Summary</Label>
              <textarea
                placeholder="SUMMARY..."
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-primary/50 transition-all outline-none resize-none no-scrollbar"
              />
            </div>
            <Button 
              className="w-full h-14 rounded-2xl text-black font-black uppercase tracking-widest text-xs transition-all" 
              onClick={onUpdateGoal} 
              disabled={!editTitle.trim()} 
              style={{ backgroundColor: dimensionColor, boxShadow: `0 0 20px ${dimensionColor}40` }}
            >
              Apply Transformations
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
