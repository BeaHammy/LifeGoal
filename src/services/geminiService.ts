import { GoogleGenAI, Type } from "@google/genai";
import { DimensionType, Task, Goal } from "../store/useStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  async generateTasks(goal: Goal, latestLog?: string): Promise<{ miniTask: Task; module: Task; newCompetences?: string[] }> {
    const contextInfo = goal.context ? `
    Context:
    - Objective: ${goal.context.objective}
    - Expected Outcome: ${goal.context.outcome}
    - Limitations/Avoid: ${goal.context.limitations}
    - Extra Info: ${goal.context.extraInfo}
    - Experience Level: ${goal.experienceLevel || 'Not specified'}
    ` : '';

    const prompt = `System: You are an AI Task Engine generating development and reinforcement tasks for a Life Goal.
    User's Life Goal: "${goal.title}" (${goal.subdimension})
    Dimension: ${goal.dimension}
    ${contextInfo}
    
    Current State:
    - Competences: ${goal.competences.join(', ') || 'None yet'}
    - Completed Modules: ${goal.completedModules.join(', ') || 'None yet'}
    - Latest Activity (Log): ${latestLog || 'None'}
    
    Experience Level Progression Guidelines:
    - "Just starting": Absolute beginner. Start from the very first steps (e.g., preparation, buying basic tools/materials, learning basic definitions). Tasks must be foundational and low-friction.
    - "Making progress": Intermediate beginner. The user understands the basics but hasn't mastered them. Focus on early-stage knowledge application and building consistent habits.
    - "Already confident but refining": Intermediate to Advanced. Skip all introductory concepts. Focus on optimization, sophisticated techniques, complex scenarios, and high-level mastery.

    RULES:
    1. MODULES (Development / Next Step):
       - Goal: Strict logical progression in skill development.
       - Requirement: Analyze "Completed Modules" and "Competences". The new Module MUST represent the immediate next logical step in the learning path.
       - Beginning Stage: If no modules are completed and user is "Just starting", focus on prerequisite tasks (setup, tools, initial theory).
       - Advancing Stage: If some modules are completed, the new task must be a clear escalation or extension of that specific knowledge.
       - Advanced Stage: If "Already confident", skip basics and focus on high-level refining.
       - Format: Structured as "Learning Content" + "Actionable Exercise".
       - Logic: knowledge + specific actionable task.
       - Base on: latest log (if relevant), completed modules, competences, life goal.

    2. MINI-TASKS (Reinforcement):
       - Goal: Motivational, simple sense of accomplishment.
       - Logic: 2-10 min actions using ONLY existing competences.
       - Base on: completed modules, competences.
       - NO new skills.

    3. COMPETENCES:
       - Modules CREATE competences.
       - Logs can CONFIRM or CREATE competences if they show real progress.
       - If the latest log shows significant progress not yet captured as a competence, identify it.

    Return JSON format:
    {
      "miniTask": { "title": "...", "description": "..." },
      "module": { "title": "...", "description": "..." },
      "newCompetencesFromLog": ["skill1", "skill2"] // Only if identifiable from the latest log
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            miniTask: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["title", "description"]
            },
            module: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["title", "description"]
            },
            newCompetencesFromLog: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["miniTask", "module"]
        }
      }
    });

    const data = JSON.parse(response.text);
    
    const miniTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: data.miniTask.title,
      description: data.miniTask.description,
      dimension: goal.dimension,
      subdimension: goal.subdimension,
      type: 'mini-task',
      completed: false,
    };

    const module: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: data.module.title,
      description: data.module.description,
      dimension: goal.dimension,
      subdimension: goal.subdimension,
      type: 'module',
      completed: false,
    };

    return { miniTask, module, newCompetences: data.newCompetencesFromLog };
  },

  async chat(message: string, state: any): Promise<string> {
    const prompt = `Jesteś asystentem AI "Aurora Life Tracker". 
    Styl: Gen Z, gaming, minimalistyczny, neutralny, krótki.
    Użytkownik mówi: "${message}"
    Aktualny stan użytkownika (punkty w wymiarach): ${JSON.stringify(state.dimensions)}
    Cele: ${JSON.stringify(state.goals.map((g: any) => g.title))}
    Odpowiedz krótko, dynamicznie. Jeśli użytkownik chce coś zacząć, zaproponuj cel i life goal.`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    return response.text;
  },

  async suggestGoals(dimension: DimensionType, currentGoals: string[]): Promise<string[]> {
    const prompt = `Użytkownik chce dodać nowy cel w kategorii "${dimension}".
    Aktualne cele: ${currentGoals.join(', ')}.
    Zaproponuj 3 nowe, krótkie i inspirujące cele (life goals).
    Odpowiedz w formacie JSON jako tablica stringów.`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text);
  },

  async refineGoal(context: { objective: string; outcome: string; limitations: string; extraInfo: string; experienceLevel?: string }): Promise<{ name: string; summary: string }> {
    const prompt = `System: You are a Life Goal Refinement Intelligence.
    User provided the following conversational context:
    1. Primary Goal: ${context.objective}
    2. Success Definition (Outcome): ${context.outcome}
    3. Blockers/Limitations: ${context.limitations}
    4. Current Proficiency Level: ${context.experienceLevel || 'Not specified'}
    5. Additional Nuance: ${context.extraInfo}
    
    Task:
    - Create a high-impact, professional, and slightly cyberpunk-themed Life Goal name (max 5 words).
    - Write a compelling summary (max 15 words) that integrates the objective and the success criteria while respecting limitations.
    
    Return JSON format: { "name": "...", "summary": "..." }`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ["name", "summary"]
        }
      }
    });

    return JSON.parse(response.text);
  },

  async generateStatsInsights(stats: any): Promise<string> {
    const prompt = `Jesteś analitykiem AI "Aurora Life Tracker". 
    Przeanalizuj statystyki użytkownika i podaj krótkie, motywujące wnioski (AI Insights).
    Statystyki: ${JSON.stringify(stats)}
    Podaj:
    1. Najsilniejszy wymiar.
    2. Najsłabszy wymiar.
    3. Wykryte trendy (np. wzrost aktywności w weekendy).
    4. Sugestie balansu.
    5. Oznaki prokrastynacji (jeśli są).
    6. Rekomendowany następny krok.
    Styl: Cyberpunkowy, minimalistyczny, konkretny, inspirujący. Krótkie zdania.`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    return response.text;
  },

  async categorizeLog(logText: string, currentGoal: Goal, allGoals: Goal[]): Promise<{ isMatch: boolean; suggestedGoalId?: string; suggestedDimension?: DimensionType }> {
    const prompt = `System: You are an extreme context validator for a life tracker. 
    Rule 1: Be very strict. If a log does not directly contribute to or relate to the specific theme of the goal, it is NOT a match.
    Rule 2: Don't assume loose connections (e.g., "eating dinner" is NOT related to "building a phone app" even if you need energy to code).
    Rule 3: If it fits another goal in the list perfectly, suggest it.
    Rule 4: If it fits a different Dimension entirely, suggest that Dimension.

    User Log: "${logText}"
    
    Current goal: "${currentGoal.title}" (Dimension: ${currentGoal.dimension})
    Available goals to check against: ${allGoals.map(g => `ID: ${g.id}, Title: ${g.title}, Dimension: ${g.dimension}`).join('; ')}
    
    Dimensions Definition:
    - 'Work & Learning': Professional development, academic studies, career growth.
    - 'Social': Relationship building, networking, social events, family.
    - 'Hobby & Creativity': Artistic pursuits, games, personal hobbies, creative projects.
    - 'Health & Wellness': Exercise, mental health, diet, sleep, medical.
    - 'Finance': Budgeting, saving, investing, debt management.
    - 'Everyday Activities': Chores, household tasks, routine non-specialized actions (e.g., "making dinner", "doing laundry").
    
    Task: Is this log a direct match for the current goal? If it's a general household task and the current goal is something specific like "build an app", it is NOT a match.
    
    Response format JSON:
    {
      "isMatch": boolean,
      "suggestedGoalId": string | null,
      "suggestedDimension": string | null
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMatch: { type: Type.BOOLEAN },
            suggestedGoalId: { type: Type.STRING, nullable: true },
            suggestedDimension: { type: Type.STRING, nullable: true },
          },
          required: ["isMatch"]
        }
      }
    });

    return JSON.parse(response.text);
  }
};
