import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Button } from '../components/ui/button';
import { useStore, DimensionType } from '../store/useStore';
import { geminiService } from '../services/geminiService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { 
  Trophy, TrendingUp, BarChart3, PieChart as PieChartIcon, 
  Calendar, Sparkles, ChevronDown, ChevronUp, Lock, CheckCircle2,
  Flame, Target, Star, Zap, Archive, ChevronLeft,
  Briefcase, Users, Palette, Activity, Coins
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

const COLORS = ['#a855f7', '#d946ef', '#22d3ee', '#10b981', '#f59e0b', '#ef4444'];

const DIMENSION_ICONS: Record<string, React.ElementType> = {
  'Work & Learning': Briefcase,
  'Social': Users,
  'Hobby & Creativity': Palette,
  'Health & Wellness': Activity,
  'Finance': Coins,
  'Everyday Activities': Zap
};

export const StatsAchievements: React.FC = () => {
  const navigate = useNavigate();
  const { completedTasks, dimensions } = useStore();
  const [aiInsights, setAiInsights] = React.useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState({ stats: true, achievements: true, archive: false });
  const [insightsExpanded, setInsightsExpanded] = React.useState(false);

  // Process data for charts
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const activityTrendData = last7Days.map(date => ({
    date: date.split('-').slice(1).join('/'),
    tasks: completedTasks.filter(t => t.completedAt?.startsWith(date)).length
  }));

  const dimensionData = Object.values(dimensions).map(d => ({
    name: d.name,
    points: d.points
  }));

  const taskDistributionData = Object.values(dimensions).map(d => ({
    name: d.name,
    value: completedTasks.filter(t => t.dimension === d.name).length
  })).filter(d => d.value > 0);

  // Heatmap data (last 30 days)
  const last30Days = [...Array(30)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      date: d.toISOString().split('T')[0],
      count: completedTasks.filter(t => t.completedAt?.startsWith(d.toISOString().split('T')[0])).length
    };
  });

  // Achievements logic
  const totalPoints = Object.values(dimensions).reduce((acc, d) => acc + d.points, 0);
  const maxStreak = 0; // Placeholder for streak logic if implemented in store later

  const achievements = [
    { id: 'streak-3', title: 'Initiate', desc: '3 Day Streak', icon: Flame, requirement: 3, current: maxStreak, type: 'streak' },
    { id: 'streak-7', title: 'Consistent', desc: '7 Day Streak', icon: Flame, requirement: 7, current: maxStreak, type: 'streak' },
    { id: 'streak-30', title: 'Legend', desc: '30 Day Streak', icon: Flame, requirement: 30, current: maxStreak, type: 'streak' },
    { id: 'points-50', title: 'Adept', desc: '50 Total Points', icon: Target, requirement: 50, current: totalPoints, type: 'points' },
    { id: 'points-250', title: 'Master', desc: '250 Total Points', icon: Target, requirement: 250, current: totalPoints, type: 'points' },
    { id: 'points-500', title: 'Grandmaster', desc: '500 Total Points', icon: Target, requirement: 500, current: totalPoints, type: 'points' },
    { id: 'dim-health-10', title: 'Vitality', desc: '10 Health & Wellness Points', icon: Activity, requirement: 10, current: dimensions['Health & Wellness'].points, type: 'dimension' },
    { id: 'dim-work-10', title: 'Architect', desc: '10 Work Points', icon: Briefcase, requirement: 10, current: dimensions['Work & Learning'].points, type: 'dimension' },
    { id: 'dim-social-10', title: 'Networker', desc: '10 Social Points', icon: Users, requirement: 10, current: dimensions['Social'].points, type: 'dimension' },
    { id: 'dim-hobby-10', title: 'Creator', desc: '10 Hobby & Creativity Points', icon: Palette, requirement: 10, current: dimensions['Hobby & Creativity'].points, type: 'dimension' },
    { id: 'dim-finance-10', title: 'Tycoon', desc: '10 Finance Points', icon: Coins, requirement: 10, current: dimensions['Finance'].points, type: 'dimension' },
    { id: 'dim-everyday-10', title: 'Efficiency', desc: '10 Everyday Activities Points', icon: Zap, requirement: 10, current: dimensions['Everyday Activities'].points, type: 'dimension' },
    { id: 'rare-perfect', title: 'Perfect Balance', desc: 'All dimensions > 5', icon: Star, requirement: 5, current: Math.min(...Object.values(dimensions).map(d => d.points)), type: 'rare' },
  ];

  React.useEffect(() => {
    const fetchInsights = async () => {
      if (completedTasks.length === 0) return;
      setIsLoadingInsights(true);
      try {
        const statsSummary = {
          totalTasks: completedTasks.length,
          dimensionPoints: dimensions,
          recentActivity: activityTrendData
        };
        const insights = await geminiService.generateStatsInsights(statsSummary);
        setAiInsights(insights);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingInsights(false);
      }
    };
    fetchInsights();
  }, [completedTasks.length]);

  const toggleSection = (section: 'stats' | 'achievements' | 'archive') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto overflow-y-auto no-scrollbar space-y-12">
      {/* Header */}
      <header className="flex items-center gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')} 
            className="rounded-full bg-white/5 h-12 w-12 border border-white/10 hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </Button>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 hidden md:block">Back to Constellation</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1"
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter neon-text italic uppercase">Evolution Metrics</h1>
          <p className="text-muted-foreground font-bold tracking-[0.2em] text-[10px] mt-2 flex items-center gap-3">
            <span className="w-12 h-[1px] bg-primary/30" />
            PERFORMANCE ANALYSIS & MILESTONES
          </p>
        </motion.div>
        <div className="text-right hidden md:block">
          <div className="text-3xl font-black text-primary italic tracking-tighter">{totalPoints} XP</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Total Accumulation</div>
        </div>
      </header>

      {/* Section A: General Stats */}
      <section className="space-y-6">
        <button 
          onClick={() => toggleSection('stats')}
          className="flex items-center gap-4 w-full group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-black italic tracking-tight uppercase">General Intelligence</h2>
          <div className="flex-1 h-[1px] bg-white/10" />
          {expandedSections.stats ? <ChevronUp className="text-muted-foreground" /> : <ChevronDown className="text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {expandedSections.stats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Activity Trend */}
                <Card className="lg:col-span-8 glass-card border-none overflow-hidden relative group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Activity Velocity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px] pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activityTrendData}>
                        <defs>
                          <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#ffffff30" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#ffffff30" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ color: '#a855f7' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tasks" 
                          stroke="#a855f7" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorTasks)" 
                          animationDuration={2000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* AI Insights Panel */}
                <Card 
                  className={cn(
                    "lg:col-span-4 glass-card border-none relative overflow-hidden flex flex-col transition-all duration-500 cursor-pointer",
                    insightsExpanded ? "lg:col-span-12" : "lg:col-span-4"
                  )}
                  onClick={() => setInsightsExpanded(!insightsExpanded)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] -mr-16 -mt-16" />
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Neural Analysis
                    </CardTitle>
                    <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                      {insightsExpanded ? 'Click to Collapse' : 'Click to Expand'}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {isLoadingInsights ? (
                      <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50 py-10">
                        <Sparkles className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Processing Data...</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <div className={cn(
                          "text-xs leading-relaxed font-medium text-muted-foreground",
                          !insightsExpanded && "line-clamp-3"
                        )}>
                          <Markdown>{aiInsights || "Complete more tasks to unlock deep neural insights into your evolution pattern."}</Markdown>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Task Distribution */}
                <Card className="lg:col-span-6 glass-card border-none overflow-hidden relative">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {taskDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black italic">{completedTasks.length}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Total</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Heatmap */}
                <Card className="lg:col-span-12 glass-card border-none overflow-hidden relative">
                  <CardHeader>
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Temporal Engagement Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center py-4">
                      {last30Days.map((day, i) => (
                        <div 
                          key={day.date}
                          title={`${day.date}: ${day.count} tasks`}
                          className={cn(
                            "w-4 h-4 rounded-sm transition-all duration-500",
                            day.count === 0 ? "bg-white/5" : 
                            day.count < 2 ? "bg-primary/20" :
                            day.count < 4 ? "bg-primary/50" : "bg-primary neon-glow"
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex justify-center gap-4 mt-4 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Less Active</span>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-sm bg-white/5" />
                        <div className="w-2 h-2 rounded-sm bg-primary/20" />
                        <div className="w-2 h-2 rounded-sm bg-primary/50" />
                        <div className="w-2 h-2 rounded-sm bg-primary" />
                      </div>
                      <span>High Engagement</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Section B: Achievements */}
      <section className="space-y-6">
        <button 
          onClick={() => toggleSection('achievements')}
          className="flex items-center gap-4 w-full group"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 group-hover:bg-accent/20 transition-all">
            <Trophy className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-xl font-black italic tracking-tight uppercase">Legacy Achievements</h2>
          <div className="flex-1 h-[1px] bg-white/10" />
          {expandedSections.achievements ? <ChevronUp className="text-muted-foreground" /> : <ChevronDown className="text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {expandedSections.achievements && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {achievements.map((ach, index) => {
                  const isUnlocked = ach.current >= ach.requirement;
                  return (
                    <motion.div
                      key={ach.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "relative p-6 rounded-[2.5rem] flex flex-col items-center text-center transition-all duration-700 group",
                        isUnlocked 
                          ? "glass-card border-primary/30 bg-primary/5" 
                          : "bg-white/5 border border-white/5 opacity-40 grayscale"
                      )}
                    >
                      {isUnlocked && (
                        <div className="absolute inset-0 bg-primary/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                      
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500",
                        isUnlocked ? "bg-primary neon-glow scale-110" : "bg-white/10"
                      )}>
                        {isUnlocked ? (
                          <ach.icon className="w-8 h-8 text-black" />
                        ) : (
                          <Lock className="w-8 h-8 text-muted-foreground/50" />
                        )}
                      </div>

                      <h3 className="font-black italic tracking-tighter text-lg uppercase mb-1">{ach.title}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{ach.desc}</p>
                      
                      {!isUnlocked && (
                        <div className="mt-4 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary/50 transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (ach.current / ach.requirement) * 100)}%` }}
                          />
                        </div>
                      )}
                      
                      {isUnlocked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-lg"
                        >
                          <CheckCircle2 className="w-4 h-4 text-black" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Section C: Archive */}
      <section className="space-y-6 pb-20">
        <button 
          onClick={() => toggleSection('archive')}
          className="flex items-center gap-4 w-full group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-all">
            <Archive className="w-5 h-5 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-black italic tracking-tight uppercase">Neural Archive</h2>
          <div className="flex-1 h-[1px] bg-white/10" />
          {expandedSections.archive ? <ChevronUp className="text-muted-foreground" /> : <ChevronDown className="text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {expandedSections.archive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="glass-card border-none overflow-hidden relative">
                <CardHeader>
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progression Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedTasks.slice(0, 20).map((task, i) => {
                      const isLog = task.type === 'log';
                      return (
                        <div 
                          key={task.id} 
                          className={cn(
                            "flex flex-col gap-3 p-4 rounded-3xl border transition-all",
                            isLog 
                              ? "bg-primary/5 border-primary/20" 
                              : "bg-white/5 border-white/10"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isLog ? (
                                <Badge className="bg-primary text-black text-[7px] font-black uppercase tracking-widest px-2 h-4">Neural Sync</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[7px] border-white/10 uppercase h-4">Progression</Badge>
                              )}
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                                {new Date(task.completedAt!).toLocaleDateString()}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-[7px] border-white/10 uppercase opacity-50">{task.dimension}</Badge>
                          </div>
                          <div className="flex-1">
                            <span className="text-[11px] font-bold text-white/90 leading-relaxed">
                              {isLog ? `"${task.title}"` : `Unlocked progression in ${task.subdimension}`}
                            </span>
                            {!isLog && <p className="text-[10px] text-muted-foreground mt-1">{task.title}</p>}
                          </div>
                          {isLog && task.attachment && (
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 mt-1">
                              <img src={task.attachment} alt="Sync evidence" className="object-cover w-full h-full opacity-80" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {completedTasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground italic text-xs">No progression logs detected yet.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};
