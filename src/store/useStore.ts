import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DimensionType = 'Work & Learning' | 'Social' | 'Hobby & Creativity' | 'Health & Wellness' | 'Finance' | 'Everyday Activities';

export type TaskType = 'streak' | 'development' | 'user-created' | 'log' | 'mini-task' | 'module';

export interface Task {
  id: string;
  title: string;
  description: string;
  dimension: DimensionType;
  subdimension: string;
  type: TaskType;
  completed: boolean;
  completedAt?: string;
  attachment?: string;
  streakCount?: number;
  deadline?: string;
}

export interface GoalLog {
  id: string;
  text: string;
  description?: string;
  photo?: string;
  createdAt: string;
  suggestedDimension?: DimensionType;
}

export interface Goal {
  id: string;
  title: string;
  dimension: DimensionType;
  subdimension: string;
  deployed: boolean;
  active: boolean;
  tasks: Task[];
  competences: string[];
  completedModules: string[];
  experienceLevel?: 'Just starting' | 'Making progress' | 'Already confident but refining';
  createdAt: string;
  log?: string;
  summary?: string;
  context?: {
    objective: string;
    outcome: string;
    limitations: string;
    extraInfo: string;
  };
}

export interface DimensionState {
  name: DimensionType;
  points: number;
  lifeGoals: string[];
}

interface LifeTrackerState {
  dimensions: Record<DimensionType, DimensionState>;
  goals: Goal[];
  completedTasks: Task[];
  reloadCount: number;
  lastReloadDate: string;
  
  addPoints: (dimension: DimensionType, points: number) => void;
  addGoal: (goal: Goal) => void;
  deployGoal: (goalId: string, tasks: Task[]) => void;
  undeployGoal: (goalId: string) => void;
  toggleGoalActive: (goalId: string) => void;
  completeTask: (taskId: string, attachment?: string) => void;
  reloadTask: (taskId: string, newTask: Task) => void;
  addTaskToGoal: (goalId: string, task: Task) => void;
  addUserAction: (goalId: string, actionTitle: string) => void;
  updateGoalLog: (goalId: string, log: string) => void;
  addGoalLog: (goalId: string, log: GoalLog) => void;
  moveGoalLog: (fromGoalId: string, toGoalId: string, log: GoalLog) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  regenerateGoalTasks: (goalId: string, latestLog?: string) => Promise<void>;
  resetReloads: () => void;
  resetAllData: () => void;
  isChatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  isTaskPanelOpen: boolean;
  setTaskPanelOpen: (open: boolean) => void;
  taskToComplete: Task | null;
  setTaskToComplete: (task: Task | null) => void;
  dailyTasks: Task[];
  dailyTasksLastGeneratedAt: string | null;
  regenerateDailyTasks: () => void;
}

const initialDimensions: Record<DimensionType, DimensionState> = {
  'Work & Learning': { name: 'Work & Learning', points: 0, lifeGoals: [] },
  'Social': { name: 'Social', points: 0, lifeGoals: [] },
  'Hobby & Creativity': { name: 'Hobby & Creativity', points: 0, lifeGoals: [] },
  'Health & Wellness': { name: 'Health & Wellness', points: 0, lifeGoals: [] },
  'Finance': { name: 'Finance', points: 0, lifeGoals: [] },
  'Everyday Activities': { name: 'Everyday Activities', points: 0, lifeGoals: [] },
};

export const useStore = create<LifeTrackerState>()(
  persist(
    (set, get) => ({
      dimensions: initialDimensions,
      goals: [],
      completedTasks: [],
      reloadCount: 0,
      lastReloadDate: new Date().toISOString().split('T')[0],
      dailyTasks: [],
      dailyTasksLastGeneratedAt: null,

      regenerateDailyTasks: () => {
        const state = get();
        const activeGoals = state.goals.filter(g => g.active);
        
        if (activeGoals.length === 0) {
          set({ dailyTasks: [], dailyTasksLastGeneratedAt: new Date().toISOString() });
          return;
        }

        // Calculate progress for each goal (completions in last 7 days or just count total completed)
        // Let's count total completions for simplicity and "least worked on" meaning lowest absolute completion count
        const goalStats = activeGoals.map(goal => {
          const completions = state.completedTasks.filter(t => t.subdimension === goal.subdimension).length;
          return { goal, completions };
        });

        // Sort by completions ascending (least worked on first)
        const sortedGoals = goalStats.sort((a, b) => a.completions - b.completions).map(s => s.goal);

        const selectedTasks: Task[] = [];
        
        // Strategy: 
        // 1. Try to take one module from each of the least worked goals
        // 2. Try to take one mini-task from each of the least worked goals
        // 3. Round-robin until we have 5 tasks
        
        const goalStack = [...sortedGoals];
        let taskTypes: TaskType[] = ['module', 'mini-task'];
        let typeIdx = 0;

        while (selectedTasks.length < 5 && goalStack.length > 0) {
          const type = taskTypes[typeIdx % taskTypes.length];
          let taskAdded = false;

          for (let i = 0; i < goalStack.length; i++) {
            const goal = goalStack[i];
            const task = goal.tasks.find(t => t.type === type && !selectedTasks.some(st => st.id === t.id));
            
            if (task) {
              selectedTasks.push(task);
              taskAdded = true;
              if (selectedTasks.length >= 5) break;
            }
          }

          if (!taskAdded) {
            // If we couldn't find a task of current type in ANY goal, try next type
            typeIdx++;
            // If we've tried all types and still no task added, we are stuck
            if (typeIdx >= taskTypes.length * goalStack.length) break;
          } else {
            // Success adding a task of this type, cycle type for next task
            typeIdx++;
          }
        }

        // Final fallback: just fill with any available tasks from active goals if we have less than 5
        if (selectedTasks.length < 5) {
          const allAvailableTasks = activeGoals.flatMap(g => g.tasks).filter(t => !selectedTasks.some(st => st.id === t.id));
          selectedTasks.push(...allAvailableTasks.slice(0, 5 - selectedTasks.length));
        }

        set({ 
          dailyTasks: selectedTasks.slice(0, 5), 
          dailyTasksLastGeneratedAt: new Date().toISOString() 
        });
      },

      addPoints: (dimension, points) => set((state) => ({
        dimensions: {
          ...state.dimensions,
          [dimension]: {
            ...state.dimensions[dimension],
            points: state.dimensions[dimension].points + points
          }
        }
      })),

      addGoal: (goal) => set((state) => {
        const dimension = state.dimensions[goal.dimension];
        const isActive = goal.active ?? false;
        
        let newGoals = [...state.goals];
        const dimensionGoals = state.goals.filter(g => g.dimension === goal.dimension && g.active);

        if (isActive && dimensionGoals.length >= 5) {
          const oldestActive = dimensionGoals.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )[0];
          
          newGoals = newGoals.map(g => 
            g.id === oldestActive.id ? { ...g, active: false } : g
          );
        }

        const goalToAdd: Goal = { 
          ...goal, 
          active: isActive, 
          createdAt: goal.createdAt || new Date().toISOString(),
          competences: goal.competences || [],
          completedModules: goal.completedModules || []
        };
        newGoals.push(goalToAdd);

        if (!dimension.lifeGoals.includes(goal.subdimension)) {
          return {
            goals: newGoals,
            dimensions: {
              ...state.dimensions,
              [goal.dimension]: {
                ...dimension,
                lifeGoals: [...dimension.lifeGoals, goal.subdimension]
              }
            }
          };
        }
        return { goals: newGoals };
      }),

      deployGoal: (goalId, tasks) => set((state) => {
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal) return state;

        const dimensionGoals = state.goals.filter(g => g.dimension === goal.dimension && g.active);
        
        let newGoals = state.goals.map(g => 
          g.id === goalId ? { ...g, deployed: true, active: true, tasks: tasks } : g
        );

        if (dimensionGoals.length >= 5) {
          // Find oldest active goal in this dimension and deactivate it
          const oldestActive = dimensionGoals.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )[0];
          
          newGoals = newGoals.map(g => 
            g.id === oldestActive.id ? { ...g, active: false } : g
          );
        }

        return { goals: newGoals };
      }),

      undeployGoal: (goalId) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? { ...g, deployed: false, active: false, tasks: [] } : g)
      })),

      toggleGoalActive: (goalId) => set((state) => {
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal) return state;

        if (!goal.active) {
          const dimensionGoals = state.goals.filter(g => g.dimension === goal.dimension && g.active);
          let newGoals = state.goals.map(g => g.id === goalId ? { ...g, active: true } : g);

          if (dimensionGoals.length >= 5) {
            const oldestActive = dimensionGoals.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )[0];
            
            newGoals = newGoals.map(g => 
              g.id === oldestActive.id ? { ...g, active: false } : g
            );
          }
          return { goals: newGoals };
        } else {
          return {
            goals: state.goals.map(g => g.id === goalId ? { ...g, active: false } : g)
          };
        }
      }),

      completeTask: (taskId, attachment) => set((state) => {
        let completedTask: Task | undefined;
        let goalId: string | undefined;

        const newGoals = state.goals.map(goal => {
          const taskIndex = goal.tasks.findIndex(t => t.id === taskId);
          if (taskIndex !== -1) {
            completedTask = { 
              ...goal.tasks[taskIndex], 
              completed: true, 
              completedAt: new Date().toISOString(),
              attachment 
            };
            goalId = goal.id;
            
            // If it's a module, add to completedModules
            const updatedCompletedModules = completedTask.type === 'module' 
              ? [...goal.completedModules, completedTask.title]
              : goal.completedModules;

            return { 
              ...goal, 
              tasks: goal.tasks.filter(t => t.id !== taskId),
              completedModules: updatedCompletedModules
            };
          }
          return goal;
        });

        if (completedTask) {
          const dimension = completedTask.dimension;
          // Also remove from dailyTasks if present
          const newDailyTasks = state.dailyTasks.filter(t => t.id !== taskId);
          
          return {
            goals: newGoals,
            completedTasks: [completedTask, ...state.completedTasks],
            dailyTasks: newDailyTasks,
            dimensions: {
              ...state.dimensions,
              [dimension]: {
                ...state.dimensions[dimension],
                points: state.dimensions[dimension].points + 1
              }
            }
          };
        }
        return state;
      }),

      reloadTask: (taskId, newTask) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const isNewDay = state.lastReloadDate !== today;
        const currentReloadCount = isNewDay ? 0 : state.reloadCount;

        if (currentReloadCount >= 3) return state;

        return {
          reloadCount: currentReloadCount + 1,
          lastReloadDate: today,
          goals: state.goals.map(goal => ({
            ...goal,
            tasks: goal.tasks.map(t => t.id === taskId ? newTask : t)
          }))
        };
      }),

      addTaskToGoal: (goalId, task) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? { ...g, tasks: [...g.tasks, task] } : g)
      })),

      addUserAction: (goalId, actionTitle) => set((state) => {
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal) return state;

        const newUserTask: Task = {
          id: Math.random().toString(36).substring(7),
          title: actionTitle,
          description: 'User created action',
          dimension: goal.dimension,
          subdimension: goal.subdimension,
          type: 'user-created',
          completed: true,
          completedAt: new Date().toISOString()
        };

        return {
          completedTasks: [newUserTask, ...state.completedTasks],
          goals: state.goals.map(g => g.id === goalId ? { ...g, log: '' } : g),
          dimensions: {
            ...state.dimensions,
            [goal.dimension]: {
              ...state.dimensions[goal.dimension],
              points: state.dimensions[goal.dimension].points + 1
            }
          }
        };
      }),

      updateGoalLog: (goalId, log) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? { ...g, log } : g)
      })),

      addGoalLog: (goalId, goalLog) => set((state) => {
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal) return state;

        const logTask: Task = {
          id: goalLog.id,
          title: goalLog.text,
          description: goalLog.description || `Neural sync for ${goal.title}`,
          dimension: goal.dimension,
          subdimension: goal.subdimension,
          type: 'log',
          completed: true,
          completedAt: goalLog.createdAt,
          attachment: goalLog.photo
        };

        return {
          completedTasks: [logTask, ...state.completedTasks],
          dimensions: {
            ...state.dimensions,
            [goal.dimension]: {
              ...state.dimensions[goal.dimension],
              points: state.dimensions[goal.dimension].points + 1
            }
          }
        };
      }),

      moveGoalLog: (fromGoalId, toGoalId, goalLog) => set((state) => {
        // Technically moveGoalLog was only used BEFORE final sync in my previous implementation
        // but if we were to move a 'log' type task in completedTasks:
        const fromGoal = state.goals.find(g => g.id === fromGoalId);
        const toGoal = state.goals.find(g => g.id === toGoalId);
        if (!fromGoal || !toGoal) return state;

        const updatedCompletedTasks = state.completedTasks.map(t => {
          if (t.id === goalLog.id) {
            return {
              ...t,
              dimension: toGoal.dimension,
              subdimension: toGoal.subdimension,
              description: `Neural sync for ${toGoal.title}`
            };
          }
          return t;
        });

        const dimensions = { ...state.dimensions };
        if (fromGoal.dimension !== toGoal.dimension) {
          dimensions[fromGoal.dimension] = {
            ...dimensions[fromGoal.dimension],
            points: Math.max(0, dimensions[fromGoal.dimension].points - 1)
          };
          dimensions[toGoal.dimension] = {
            ...dimensions[toGoal.dimension],
            points: dimensions[toGoal.dimension].points + 1
          };
        }

        return { completedTasks: updatedCompletedTasks, dimensions };
      }),
      
      updateGoal: (goalId, updates) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? { ...g, ...updates } : g)
      })),
      
      regenerateGoalTasks: async (goalId, latestLog) => {
        const { geminiService } = await import('../services/geminiService');
        const state = get();
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal) return;

        try {
          const { miniTask, module, newCompetences } = await geminiService.generateTasks(goal, latestLog);
          const currentGoal = get().goals.find(g => g.id === goalId);
          if (currentGoal) {
            const updatedCompetences = [...new Set([...currentGoal.competences, ...(newCompetences || [])])];
            const otherTasks = currentGoal.tasks.filter(t => t.type !== 'mini-task' && t.type !== 'module');
            
            set((state) => ({
              goals: state.goals.map(g => g.id === goalId ? {
                ...g,
                competences: updatedCompetences,
                tasks: [...otherTasks, miniTask, module]
              } : g)
            }));
            
            // Also refresh daily tasks
            get().regenerateDailyTasks();
          }
        } catch (error) {
          console.error('Failed to regenerate goal tasks:', error);
        }
      },
      
      deleteGoal: (goalId) => set((state) => ({
        goals: state.goals.filter(g => g.id !== goalId)
      })),

      resetReloads: () => set({ reloadCount: 0, lastReloadDate: new Date().toISOString().split('T')[0] }),
      
      resetAllData: () => {
        localStorage.removeItem('life-tracker-storage');
        set({
          dimensions: initialDimensions,
          goals: [],
          completedTasks: [],
          reloadCount: 0,
          lastReloadDate: new Date().toISOString().split('T')[0],
          isChatOpen: false,
          isTaskPanelOpen: false,
          taskToComplete: null
        });
        window.location.reload();
      },

      isChatOpen: false,
      setChatOpen: (open) => set({ isChatOpen: open }),
      isTaskPanelOpen: false,
      setTaskPanelOpen: (open) => set({ isTaskPanelOpen: open }),
      taskToComplete: null,
      setTaskToComplete: (task) => set({ taskToComplete: task })
    }),
    {
      name: 'life-tracker-storage',
      version: 5,
      migrate: (persistedState: any, version: number) => {
        let state = { ...persistedState };
        
        if (version < 5 && state.goals) {
          state.goals = state.goals.map((goal: any) => ({
            ...goal,
            logs: goal.logs ?? []
          }));
        }

        if (version === 0 && state.dimensions) {
          const dimensions = { ...state.dimensions };
          for (const key in dimensions) {
            if (dimensions[key].subdimensions && !dimensions[key].lifeGoals) {
              dimensions[key].lifeGoals = dimensions[key].subdimensions;
              delete dimensions[key].subdimensions;
            }
          }
          state.dimensions = dimensions;
        }

        if (version < 2 && state.goals) {
          state.goals = state.goals.map((goal: any) => ({
            ...goal,
            active: goal.active ?? goal.deployed ?? false,
            createdAt: goal.createdAt ?? new Date().toISOString()
          }));
        }

        if (version < 3 && state.goals) {
          state.goals = state.goals.map((goal: any) => ({
            ...goal,
            log: goal.log ?? ''
          }));
        }

        if (version < 4 && state.dimensions) {
          const oldDimensions = state.dimensions;
          const newDimensions: any = {
            'Work & Learning': oldDimensions['Work & Learning'] || { name: 'Work & Learning', points: 0, lifeGoals: [] },
            'Social': oldDimensions['Social'] || { name: 'Social', points: 0, lifeGoals: [] },
            'Hobby & Creativity': { name: 'Hobby & Creativity', points: 0, lifeGoals: [] },
            'Health & Wellness': { name: 'Health & Wellness', points: 0, lifeGoals: [] },
            'Finance': oldDimensions['Finance'] || { name: 'Finance', points: 0, lifeGoals: [] },
            'Everyday Activities': { name: 'Everyday Activities', points: 0, lifeGoals: [] },
          };
          
          if (oldDimensions['Health']) {
            newDimensions['Health & Wellness'].points = oldDimensions['Health'].points;
            newDimensions['Health & Wellness'].lifeGoals = oldDimensions['Health'].lifeGoals;
          }
          
          const hobbyPoints = oldDimensions['Hobby']?.points || 0;
          const creativityPoints = oldDimensions['Creativity']?.points || 0;
          const hobbyGoals = oldDimensions['Hobby']?.lifeGoals || [];
          const creativityGoals = oldDimensions['Creativity']?.lifeGoals || [];
          
          newDimensions['Hobby & Creativity'].points = hobbyPoints + creativityPoints;
          newDimensions['Hobby & Creativity'].lifeGoals = Array.from(new Set([...hobbyGoals, ...creativityGoals]));
          
          state.dimensions = newDimensions;
          
          if (state.goals) {
            state.goals = state.goals.map((goal: any) => {
              if (goal.dimension === 'Health') return { ...goal, dimension: 'Health & Wellness' };
              if (goal.dimension === 'Hobby' || goal.dimension === 'Creativity') return { ...goal, dimension: 'Hobby & Creativity' };
              return goal;
            });
          }
          
          if (state.completedTasks) {
            state.completedTasks = state.completedTasks.map((task: any) => {
              if (task.dimension === 'Health') return { ...task, dimension: 'Health & Wellness' };
              if (task.dimension === 'Hobby' || task.dimension === 'Creativity') return { ...task, dimension: 'Hobby & Creativity' };
              return task;
            });
          }
        }

        return state;
      }
    }
  )
);
