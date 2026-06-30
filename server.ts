import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    console.warn("WARNING: GEMINI_API_KEY is missing or contains placeholder. Backend will use intelligent fallback simulations.");
    return null;
  }

  try {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    return aiInstance;
  } catch (error) {
    console.error("Failed to initialize Gemini Client:", error);
    return null;
  }
}

// 1. Task Prioritization Endpoint (Task Prioritizer Agent)
app.post('/api/prioritize', async (req, res) => {
  const { tasks, currentTime = new Date().toISOString() } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.json({ tasks: [], agentInsight: "No tasks provided to prioritize." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant dynamic mock fallback
    const prioritized = tasks.map((task, index) => {
      const score = Math.max(20, 100 - (index * 15) - (task.dueDate ? Math.max(0, 5 - Math.round((new Date(task.dueDate).getTime() - new Date(currentTime).getTime()) / (1000 * 60 * 60 * 24))) * 10 : 0));
      return {
        id: task.id,
        priorityScore: Math.min(100, Math.max(10, score)),
        priorityLevel: score > 75 ? 'high' : score > 40 ? 'medium' : 'low',
        priorityReasoning: `Prioritized dynamically based on standard due date analysis (${task.dueDate || 'No due date'}) and task categorization (${task.category}).`
      };
    });
    
    return res.json({
      tasks: prioritized,
      agentInsight: "Prioritizer completed local heuristic ranking. To enable full generative analysis and custom context reasoning, please attach your Gemini API Key in Settings > Secrets."
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are the "Task Prioritizer Agent". Analyze the following list of tasks and rank/score them (0-100) based on their urgency, importance, and relative proximity to the current time: ${currentTime}.
      
      Tasks list:
      ${JSON.stringify(tasks, null, 2)}
      
      Provide your response in raw JSON format matching this schema:
      {
        "tasks": [
          { "id": "task_id_here", "priorityScore": 85, "priorityLevel": "high"|"medium"|"low", "priorityReasoning": "Why this priority level and score..." }
        ],
        "agentInsight": "A high-level proactive summary tip or recommendation for the user's workload today."
      }`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  priorityScore: { type: Type.NUMBER },
                  priorityLevel: { type: Type.STRING },
                  priorityReasoning: { type: Type.STRING }
                },
                required: ['id', 'priorityScore', 'priorityLevel', 'priorityReasoning']
              }
            },
            agentInsight: { type: Type.STRING }
          },
          required: ['tasks', 'agentInsight']
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || '{}');
    res.json(data);
  } catch (error: any) {
    console.log("Prioritizing tasks locally via offline metrics.");
    
    // Elegant dynamic mock fallback
    const prioritized = tasks.map((task: any, index: number) => {
      const score = Math.max(20, 100 - (index * 15) - (task.dueDate ? Math.max(0, 5 - Math.round((new Date(task.dueDate).getTime() - new Date(currentTime).getTime()) / (1000 * 60 * 60 * 24))) * 10 : 0));
      return {
        id: task.id,
        priorityScore: Math.min(100, Math.max(10, score)),
        priorityLevel: score > 75 ? 'high' : score > 40 ? 'medium' : 'low',
        priorityReasoning: `Prioritized dynamically based on standard due date analysis (${task.dueDate || 'No due date'}) and task categorization (${task.category}).`
      };
    });
    
    res.json({
      tasks: prioritized,
      agentInsight: "Prioritizer completed local heuristic ranking. Full proactive analysis is standing by (resorts to local processing if API quota limits are temporarily hit)."
    });
  }
});

// 2. Task Breakdown / Autonomous Planning Endpoint (Scheduler/Planner Agent)
app.post('/api/breakdown', async (req, res) => {
  const { task } = req.body;

  if (!task) {
    return res.status(400).json({ error: "Task information is required." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Dynamic simulated breakdown
    const simSteps = [
      { title: `Initialize and gather materials for "${task.title}"`, duration: Math.round(task.estimatedDuration * 0.25) || 15 },
      { title: `Execute core tasks for "${task.title}"`, duration: Math.round(task.estimatedDuration * 0.5) || 30 },
      { title: `Review and finalize outputs of "${task.title}"`, duration: Math.round(task.estimatedDuration * 0.25) || 15 }
    ];

    return res.json({
      steps: simSteps,
      planningInsight: `I have segmented "${task.title}" into 3 logical phases. For deeper, personalized actionable steps, configure your Gemini API Key.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `You are the "Autonomous Task Planning Agent". Break down the following major task into smaller, concrete, highly-actionable micro-steps (minimum 2, maximum 5 steps). The total duration of all steps should roughly match the estimated task duration of ${task.estimatedDuration} minutes.
      
      Task Details:
      Title: ${task.title}
      Description: ${task.description || 'No description provided'}
      Category: ${task.category}
      Estimated Total Duration: ${task.estimatedDuration} minutes
      
      Provide your response in JSON format matching this schema:
      {
        "steps": [
          { "title": "Sub-step title", "duration": 20 }
        ],
        "planningInsight": "A tip or proactive advice on how to execute these steps smoothly."
      }`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.INTEGER }
                },
                required: ['title', 'duration']
              }
            },
            planningInsight: { type: Type.STRING }
          },
          required: ['steps', 'planningInsight']
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || '{}');
    res.json(data);
  } catch (error: any) {
    console.log("Segmenting task steps locally via offline template.");
    const simSteps = [
      { title: `Initialize and gather materials for "${task.title}"`, duration: Math.round(task.estimatedDuration * 0.25) || 15 },
      { title: `Execute core tasks for "${task.title}"`, duration: Math.round(task.estimatedDuration * 0.5) || 30 },
      { title: `Review and finalize outputs of "${task.title}"`, duration: Math.round(task.estimatedDuration * 0.25) || 15 }
    ];

    res.json({
      steps: simSteps,
      planningInsight: `I have segmented "${task.title}" into 3 logical phases using local heuristics (offline fallback mode active).`
    });
  }
});

// 3. AI-Powered Smart Scheduling Endpoint (Scheduler Agent)
app.post('/api/schedule', async (req, res) => {
  const { tasks, calendarEvents, workingHours = { start: 9, end: 17 }, currentTime = new Date().toISOString() } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.json({ scheduledTasks: [], schedulerInsight: "No tasks to schedule." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Simulating schedule optimization
    let currentPtr = new Date(currentTime);
    currentPtr.setMinutes(currentPtr.getMinutes() + 30); // Start 30 mins from now
    
    const scheduled = tasks.map(task => {
      // Find a slot during work hours
      if (currentPtr.getHours() >= workingHours.end) {
        currentPtr.setDate(currentPtr.getDate() + 1);
        currentPtr.setHours(workingHours.start, 0, 0, 0);
      } else if (currentPtr.getHours() < workingHours.start) {
        currentPtr.setHours(workingHours.start, 0, 0, 0);
      }
      
      const startStr = currentPtr.toISOString();
      currentPtr.setMinutes(currentPtr.getMinutes() + (task.estimatedDuration || 30));
      const endStr = currentPtr.toISOString();
      
      // Pad 15 mins rest
      currentPtr.setMinutes(currentPtr.getMinutes() + 15);

      return {
        id: task.id,
        scheduledStart: startStr,
        scheduledEnd: endStr
      };
    });

    return res.json({
      scheduledTasks: scheduled,
      schedulerInsight: "Your tasks have been chronologically organized into open slots, maintaining work hour boundaries and spacing. Add your Gemini API Key to enable cognitive workload analysis & smart calendar optimization!"
    });
  }

  try {
    const prompt = `You are the "Scheduler Agent". Suggest optimal, non-overlapping time slots to perform these tasks, avoiding conflict with the busy calendar events listed.
    
    Current Reference Time: ${currentTime}
    Working Hours: ${workingHours.start}:00 to ${workingHours.end}:00 daily
    
    Tasks to Schedule (Duration in minutes):
    ${JSON.stringify(tasks, null, 2)}
    
    Existing Busy Calendar Events:
    ${JSON.stringify(calendarEvents, null, 2)}
    
    Organize them smartly: Place higher priority tasks first. Make sure tasks are scheduled in the future relative to the Reference Time. Make sure tasks fall within the working hours bounds.
    
    Provide your response in JSON format matching this schema:
    {
      "scheduledTasks": [
        { "id": "task_id_here", "scheduledStart": "ISO_timestamp", "scheduledEnd": "ISO_timestamp" }
      ],
      "schedulerInsight": "Proactive reason why these tasks were scheduled at these times (e.g., 'Work task scheduled in your morning peak productivity window, personal task placed at the end of the day')."
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scheduledTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  scheduledStart: { type: Type.STRING },
                  scheduledEnd: { type: Type.STRING }
                },
                required: ['id', 'scheduledStart', 'scheduledEnd']
              }
            },
            schedulerInsight: { type: Type.STRING }
          },
          required: ['scheduledTasks', 'schedulerInsight']
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || '{}');
    res.json(data);
  } catch (error: any) {
    console.log("Scheduling daily slots locally via offline algorithm.");
    let currentPtr = new Date(currentTime);
    currentPtr.setMinutes(currentPtr.getMinutes() + 30); // Start 30 mins from now
    
    const scheduled = tasks.map((task: any) => {
      // Find a slot during work hours
      if (currentPtr.getHours() >= workingHours.end) {
        currentPtr.setDate(currentPtr.getDate() + 1);
        currentPtr.setHours(workingHours.start, 0, 0, 0);
      } else if (currentPtr.getHours() < workingHours.start) {
        currentPtr.setHours(workingHours.start, 0, 0, 0);
      }
      
      const startStr = currentPtr.toISOString();
      currentPtr.setMinutes(currentPtr.getMinutes() + (task.estimatedDuration || 30));
      const endStr = currentPtr.toISOString();
      
      // Pad 15 mins rest
      currentPtr.setMinutes(currentPtr.getMinutes() + 15);

      return {
        id: task.id,
        scheduledStart: startStr,
        scheduledEnd: endStr
      };
    });

    res.json({
      scheduledTasks: scheduled,
      schedulerInsight: "Your tasks have been chronologically organized into open slots via offline helper heuristics."
    });
  }
});

// 4. Voice Assistant / Quick Natural Language Entry / Chat
app.post(['/api/voice', '/api/chat'], async (req, res) => {
  const { voiceInput, tasks = [], currentTime = new Date().toISOString() } = req.body;

  if (!voiceInput || voiceInput.trim() === '') {
    return res.status(400).json({ error: "Voice transcription text is required." });
  }

  const ai = getGeminiClient();
  const lowerInput = voiceInput.toLowerCase();
  const isDeadlineQuery = lowerInput.includes('deadline') || lowerInput.includes('due') || lowerInput.includes('upcoming') || lowerInput.includes('agenda') || lowerInput.includes('schedule') || lowerInput.includes('commitments');

  if (!ai) {
    let isTaskCommand = false;
    const taskKeywords = ['remind', 'schedule', 'add task', 'add', 'need to', 'must', 'buy', 'shop', 'appointment', 'meeting', 'task', 'todo', 'habit', 'work on'];
    for (const kw of taskKeywords) {
      if (lowerInput.includes(kw) && !isDeadlineQuery) {
        isTaskCommand = true;
        break;
      }
    }

    let chatResponse = "";
    let extractedTask: any = null;

    if (isDeadlineQuery) {
      const activeTasks = tasks.filter((t: any) => t.status !== 'completed');
      if (activeTasks.length === 0) {
        chatResponse = "Your active timeline is clear! There are no pending tasks or upcoming deadlines to report.";
      } else {
        // Sort active tasks by due date
        const sorted = [...activeTasks].sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const listText = sorted.slice(0, 3).map((t: any) => `"${t.title}" (Due: ${new Date(t.dueDate).toLocaleDateString()} ${new Date(t.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}, Priority: ${t.priorityLevel.toUpperCase()})`).join(', ');
        chatResponse = `Local Audit: You have ${activeTasks.length} active task(s). Here are your nearest deadlines: ${listText}.`;
      }
    } else if (isTaskCommand) {
      const title = voiceInput.replace(/(remind me to|schedule|add task|add|need to|must|buy|shop|appointment|meeting|task|todo|habit)/gi, '').trim();
      const isHigh = lowerInput.includes('urgent') || lowerInput.includes('asap') || lowerInput.includes('important');
      const tomorrow = new Date(currentTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(17, 0, 0, 0);

      const parsedTitle = title.charAt(0).toUpperCase() + title.slice(1) || "Quick Task";
      chatResponse = `I have analyzed your instruction and prepared a structured draft for the task: "${parsedTitle}". Check the parameters and confirm to save.`;
      extractedTask = {
        title: parsedTitle,
        description: `Voice Command: "${voiceInput}"`,
        category: lowerInput.includes('buy') || lowerInput.includes('shop') ? 'Personal' : 'Work',
        dueDate: tomorrow.toISOString(),
        estimatedDuration: lowerInput.includes('hour') ? 60 : 30,
        priorityLevel: isHigh ? 'high' : 'medium'
      };
    } else {
      if (lowerInput.includes('hello') || lowerInput.includes('hi ') || lowerInput.includes('hey')) {
        chatResponse = "Hello there! I am AURA-9000, your virtual cognitive scheduler. How can I help you organize your daily workload?";
      } else if (lowerInput.includes('who are you') || lowerInput.includes('your name')) {
        chatResponse = "I am AURA-9000, an AI-powered cognitive assistant built to optimize your tasks, schedules, and daily habits.";
      } else if (lowerInput.includes('help') || lowerInput.includes('what can you do')) {
        chatResponse = "I can structure complex tasks, schedule slots on your calendar, prioritize items, or chat about personal productivity!";
      } else {
        chatResponse = `I hear you! I am analyzing "${voiceInput}". If you'd like to schedule something, please specify what and when (e.g., 'schedule client sync at 3 PM').`;
      }
    }

    return res.json({ chatResponse, extractedTask });
  }

  try {
    const prompt = `You are AURA-9000, an ultra-polished, conversational, and direct AI Cognitive Scheduler & Voice Assistant. 
    Respond to the user's chat message naturally with a helpful response (maximum 2-3 sentences).
    
    Here is the user's current active tasks list with their estimated times, priorities, statuses and due dates:
    ${JSON.stringify(tasks, null, 2)}
    
    If the user asks about deadlines, upcoming tasks, what they should do next, schedules, or priorities (isDeadlineQuery = ${isDeadlineQuery}), inspect this tasks list. Summarize their nearest upcoming high-priority active deadlines clearly in natural speech. Mention times/days they are due.
    
    If the user's instruction asks you to schedule, remind, add a task, commitment, appointment, or habit, you MUST also extract the structured task parameters in the "extractedTask" field.
    If the input is just general conversation, greetings, questions, or non-scheduling talk, omit the "extractedTask" field entirely or set it to null.
    
    Input Text: "${voiceInput}"
    Current Reference Time: ${currentTime}
    
    For "extractedTask" parameters (if present and not null):
    - Title: short, direct actionable task name.
    - Description: Brief explanation of context.
    - Category: "Work", "Personal", "Health", "Finance", or "Urgent".
    - DueDate: Resolved to an ISO_timestamp relative to the Current Reference Time.
    - EstimatedDuration: Integer minutes (default to 30 or 60 if not stated).
    - PriorityLevel: "high", "medium", or "low".
    
    Provide your response in JSON format matching this schema:
    {
      "chatResponse": "Conversational reply from AURA-9000",
      "extractedTask": {
        "title": "Actionable task name",
        "description": "Short explanation",
        "category": "Inferred Category",
        "dueDate": "ISO_timestamp",
        "estimatedDuration": 30,
        "priorityLevel": "high"|"medium"|"low"
      }
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chatResponse: { type: Type.STRING },
            extractedTask: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING },
                dueDate: { type: Type.STRING },
                estimatedDuration: { type: Type.INTEGER },
                priorityLevel: { type: Type.STRING }
              },
              required: ['title', 'description', 'category', 'dueDate', 'estimatedDuration', 'priorityLevel']
            }
          },
          required: ['chatResponse']
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || '{}');
    res.json(data);
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || error?.message?.includes('quota') || JSON.stringify(error).includes('429') || JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
    if (isQuotaError) {
      console.warn("Gemini API Free Tier Quota Limit reached (429). Recovering gracefully with local cognitive heuristics.");
    } else {
      console.warn("Parsing verbal audio via Gemini API failed, recovering with local cognitive heuristics. Error message:", error?.message || error);
    }
    console.log("Parsing verbal audio locally via offline parser.");
    
    let chatResponse = "";
    let extractedTask: any = null;

    if (isDeadlineQuery) {
      const activeTasks = tasks.filter((t: any) => t.status !== 'completed');
      if (activeTasks.length === 0) {
        chatResponse = "Your active timeline is clear! There are no pending tasks or upcoming deadlines to report.";
      } else {
        const sorted = [...activeTasks].sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const listText = sorted.slice(0, 3).map((t: any) => `"${t.title}" (Due: ${new Date(t.dueDate).toLocaleDateString()} ${new Date(t.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`).join(', ');
        chatResponse = `Local Audit: You have ${activeTasks.length} active tasks. Here are your nearest deadlines: ${listText}.`;
      }
    } else {
      const title = voiceInput.replace(/(remind me to|schedule|add task|add|need to|must)/gi, '').trim();
      const isHigh = lowerInput.includes('urgent') || lowerInput.includes('asap') || lowerInput.includes('important');
      const tomorrow = new Date(currentTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(17, 0, 0, 0);

      const parsedTitle = title.charAt(0).toUpperCase() + title.slice(1) || "Quick Task";
      chatResponse = `I've prepared a draft for your task "${parsedTitle}" using my local analytics. Click below to add it to your queue.`;
      extractedTask = {
        title: parsedTitle,
        description: `Captured via offline analysis: "${voiceInput}"`,
        category: lowerInput.includes('buy') || lowerInput.includes('shop') ? 'Personal' : 'Work',
        dueDate: tomorrow.toISOString(),
        estimatedDuration: lowerInput.includes('hour') ? 60 : 30,
        priorityLevel: isHigh ? 'high' : 'medium'
      };
    }

    res.json({ chatResponse, extractedTask });
  }
});

// 5. Proactive Coach & Habit Insights Endpoint (Habit Coach & Reminder Agent)
app.post('/api/insights', async (req, res) => {
  const { tasks, habits, stats, currentTime = new Date().toISOString() } = req.body;

  const ai = getGeminiClient();
  if (!ai) {
    // Rich simulated coach feedback
    return res.json({
      motivationalMessage: "You are doing wonderful today! Keep focus and try to complete tasks on time.",
      focusScoreTip: "To increase your Focus Score to 85%, complete your upcoming prioritized task within the next hour.",
      habitRecommendations: [
        "Plan a 15-minute reflection block at the end of your day.",
        "Ensure hydrated habits by drinking water right now."
      ],
      suggestedNudges: [
        {
          triggerType: "workload",
          triggerValue: "3 pending tasks",
          message: "You have 3 work items pending. Finish the highest prioritized one to free up your late afternoon!",
          actionText: "Prioritize"
        },
        {
          triggerType: "location",
          triggerValue: "Office desk",
          message: "You are near your primary workspace. Great time to clear out that pending document work!",
          actionText: "Open Doc"
        }
      ]
    });
  }

  try {
    const prompt = `You are the "AI Proactive Habit Coach & Reminder Agent". Analyze the user's workload, completed tasks, habit consistency, and daily statistics. Generate highly motivational feedback, focus score improvements, specific custom habit suggestions, and trigger-based pro-active reminders (Smart Nudges).
    
    User Statistics:
    ${JSON.stringify(stats, null, 2)}
    
    Current Tasks state:
    ${JSON.stringify(tasks, null, 2)}
    
    Habits current state:
    ${JSON.stringify(habits, null, 2)}
    
    Current Time: ${currentTime}
    
    Generate trigger-based proactive reminders (Smart Nudges) that would motivate them into action. For example:
    - A "location" nudge triggered by "Near Office", "Near Home", "At Grocery Store".
    - A "time" nudge triggered by a specific late-morning or late-afternoon hour.
    - A "workload" nudge triggered when too many tasks accumulate.
    
    Provide your response in JSON format matching this schema:
    {
      "motivationalMessage": "Short, highly customized and powerful motivational check-in based on completed streaks or upcoming stress-points.",
      "focusScoreTip": "One direct action they can take to boost their dynamic focus score immediately.",
      "habitRecommendations": [
        "Specifically tailored new habit recommendations (e.g., 'Take a micro-stretch every 45 mins' or 'Perform 5-min brain dump in the morning')."
      ],
      "suggestedNudges": [
        {
          "triggerType": "time"|"location"|"workload",
          "triggerValue": "Target value (e.g., '14:00', 'Office desk', 'Grocery Store', '5 pending tasks')",
          "message": "Direct prompt (e.g., 'You're near the bank, pay your utility bill now')",
          "actionText": "Call-to-action button title (e.g., 'Pay now')"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            motivationalMessage: { type: Type.STRING },
            focusScoreTip: { type: Type.STRING },
            habitRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestedNudges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  triggerType: { type: Type.STRING },
                  triggerValue: { type: Type.STRING },
                  message: { type: Type.STRING },
                  actionText: { type: Type.STRING }
                },
                required: ['triggerType', 'triggerValue', 'message', 'actionText']
              }
            }
          },
          required: ['motivationalMessage', 'focusScoreTip', 'habitRecommendations', 'suggestedNudges']
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || '{}');
    res.json(data);
  } catch (error: any) {
    console.log("Coaching insights generated locally via offline heuristics.");
    res.json({
      motivationalMessage: "Focus starts with small choices! Keep steady momentum as you tackle your scheduled workload today.",
      focusScoreTip: "To increase your Focus Score to 85%, complete your upcoming prioritized task within the next hour.",
      habitRecommendations: [
        "Plan a 15-minute reflection block at the end of your day.",
        "Ensure hydrated habits by drinking water right now."
      ],
      suggestedNudges: [
        {
          triggerType: "workload",
          triggerValue: "3 pending tasks",
          message: "You have pending items. Finish the highest prioritized one to free up your late afternoon!",
          actionText: "Prioritize"
        },
        {
          triggerType: "location",
          triggerValue: "Office desk",
          message: "You are near your primary workspace. Great time to clear out that pending document work!",
          actionText: "Open Doc"
        }
      ]
    });
  }
});

// 5. Gmail Cognitive Analyzer Endpoint
app.post('/api/gmail/analyze', async (req, res) => {
  const { emails, currentTime = new Date().toISOString() } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.json({ meetings: [], agentInsight: "No emails provided to analyze." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant local heuristic fallback if Gemini is unconfigured
    const meetings: any[] = [];
    emails.forEach((email: any) => {
      const textToSearch = `${email.subject} ${email.snippet}`.toLowerCase();
      const hasMeetingKeyword = /meeting|appointment|sync|call|interview|zoom|discuss|schedule/i.test(textToSearch);
      
      if (hasMeetingKeyword) {
        // Simple extraction
        const tomorrow = new Date(currentTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0); // Default to tomorrow 2 PM

        meetings.push({
          id: `gmail-meeting-${email.id}`,
          title: email.subject || "Scheduled Call",
          description: `Discovered in email from: ${email.from || 'Unknown'}. Snippet: "${email.snippet || ''}"`,
          category: textToSearch.includes('doctor') || textToSearch.includes('health') || textToSearch.includes('dentist') ? 'Health' : 
                    textToSearch.includes('personal') || textToSearch.includes('buy') ? 'Personal' : 'Work',
          dueDate: tomorrow.toISOString(),
          estimatedDuration: textToSearch.includes('hour') ? 60 : 30,
          priorityLevel: textToSearch.includes('urgent') || textToSearch.includes('asap') || textToSearch.includes('important') ? 'high' : 'medium',
          emailSourceId: email.id
        });
      }
    });

    return res.json({
      meetings,
      agentInsight: `AURA processed ${emails.length} emails locally and extracted ${meetings.length} potential meeting draft(s). Configure your Gemini API Key for deep neural parsing of times and dates!`
    });
  }

  try {
    const prompt = `You are the "Gmail Cognitive Analyzer Agent". Your job is to read the user's recent email headers and snippets, identify any calendar meetings, appointments, commitments, sync calls, or scheduled events, and parse them into structured tasks.
    
    Current Reference Time: ${currentTime}
    
    Email list:
    ${JSON.stringify(emails, null, 2)}
    
    For each email, analyze if it refers to an upcoming or past scheduled meeting/appointment. Only include emails that represent actual meetings, appointments, or commitments. Ignore generic newsletters, spam, or emails with no scheduling context.
    
    Resolve the actual scheduled date and time into an ISO timestamp (resolve terms like "this Wednesday at 4 PM" or "tomorrow 10am" relative to the Current Reference Time and the email's date header: ${currentTime}).
    
    Provide your response in raw JSON format matching this schema:
    {
      "meetings": [
        {
          "title": "Actionable, concise meeting name (e.g. 'Project Milestone Sync' or 'Dr. Larson Checkup')",
          "description": "Short explanation of the meeting context, who sent it, and any details",
          "category": "Work"|"Personal"|"Health"|"Finance"|"Urgent",
          "dueDate": "ISO_timestamp of the scheduled meeting time",
          "estimatedDuration": 30,
          "priorityLevel": "high"|"medium"|"low",
          "emailSourceId": "The corresponding email id"
        }
      ],
      "agentInsight": "A high-level proactive summary of the user's upcoming external schedule based on their emails."
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meetings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  dueDate: { type: Type.STRING },
                  estimatedDuration: { type: Type.INTEGER },
                  priorityLevel: { type: Type.STRING },
                  emailSourceId: { type: Type.STRING }
                },
                required: ['title', 'description', 'category', 'dueDate', 'estimatedDuration', 'priorityLevel', 'emailSourceId']
              }
            },
            agentInsight: { type: Type.STRING }
          },
          required: ['meetings', 'agentInsight']
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || '{}');
    res.json(data);
  } catch (error: any) {
    const isQuotaError = error?.status === 429 || error?.message?.includes('quota') || JSON.stringify(error).includes('429') || JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
    if (isQuotaError) {
      console.warn("Gemini API Free Tier Quota Limit reached (429) during Gmail sync. Recovering gracefully with local cognitive email filters.");
    } else {
      console.warn("Gmail analysis via Gemini failed, recovering with local cognitive email filters. Error message:", error?.message || error);
    }
    
    // Heuristic fallback
    const meetings: any[] = [];
    emails.forEach((email: any) => {
      const textToSearch = `${email.subject} ${email.snippet}`.toLowerCase();
      const hasMeetingKeyword = /meeting|appointment|sync|call|interview|zoom|discuss|schedule/i.test(textToSearch);
      
      if (hasMeetingKeyword) {
        const tomorrow = new Date(currentTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);

        meetings.push({
          id: `gmail-meeting-${email.id}`,
          title: email.subject || "Scheduled Call",
          description: `Discovered in email from: ${email.from || 'Unknown'}. Snippet: "${email.snippet || ''}"`,
          category: textToSearch.includes('doctor') || textToSearch.includes('health') || textToSearch.includes('dentist') ? 'Health' : 
                    textToSearch.includes('personal') || textToSearch.includes('buy') ? 'Personal' : 'Work',
          dueDate: tomorrow.toISOString(),
          estimatedDuration: textToSearch.includes('hour') ? 60 : 30,
          priorityLevel: textToSearch.includes('urgent') || textToSearch.includes('asap') || textToSearch.includes('important') ? 'high' : 'medium',
          emailSourceId: email.id
        });
      }
    });

    res.json({
      meetings,
      agentInsight: "Gmail analysis completed via backup heuristics due to API throttle. Check meeting details carefully before sync."
    });
  }
});

// Keep track of active Cloud API settings in-memory for live webhook replies
let activeCloudApiToken = process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN || '';
let activeCloudApiPhoneId = process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID || '';

// 6. Send real WhatsApp message using Twilio REST API, Free Callmebot API, or Meta WhatsApp Cloud API
app.post('/api/whatsapp/send', async (req, res) => {
  const { 
    to, 
    body, 
    provider,
    twilioSid = process.env.TWILIO_ACCOUNT_SID, 
    twilioToken = process.env.TWILIO_AUTH_TOKEN, 
    twilioSender = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
    useCallmebot = false,
    callmebotApikey = process.env.CALLMEBOT_API_KEY,
    callmebotPhone = process.env.CALLMEBOT_PHONE,
    cloudApiToken,
    cloudApiPhoneId
  } = req.body;

  if (!body) {
    return res.status(400).json({ error: "Missing message body parameter." });
  }

  // Update server cache of Cloud API settings if provided
  if (cloudApiToken) activeCloudApiToken = cloudApiToken;
  if (cloudApiPhoneId) activeCloudApiPhoneId = cloudApiPhoneId;

  // Option A: WhatsApp Cloud API (Best for scalable project integration)
  if (provider === 'cloudapi' || (cloudApiToken && cloudApiToken.trim() !== "")) {
    const finalToken = cloudApiToken || activeCloudApiToken || process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN;
    const finalPhoneId = cloudApiPhoneId || activeCloudApiPhoneId || process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID;
    
    if (!to || !finalToken || !finalPhoneId) {
      return res.status(400).json({ 
        error: "WhatsApp Cloud API requires a Recipient Phone, Phone Number ID, and Access Token." 
      });
    }

    // Clean targetRecipient: must be digits only, no leading +, whatsapp: prefix, spaces or brackets
    const cleanRecipient = to.replace(/[\s\+\-\(\)]/g, '').replace(/^whatsapp:/, '');

    try {
      const url = `https://graph.facebook.com/v18.0/${finalPhoneId}/messages`;
      console.log(`Dispatching Meta WhatsApp Cloud API request to ${cleanRecipient} via phone ID ${finalPhoneId}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${finalToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanRecipient,
          type: "text",
          text: {
            preview_url: false,
            body: body
          }
        })
      });

      const responseText = await response.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {}

      if (response.ok) {
        return res.json({ 
          success: true, 
          provider: 'cloudapi', 
          messageId: responseData.messages?.[0]?.id || "unknown_id" 
        });
      } else {
        console.error("Meta WhatsApp Cloud API error response:", responseData);
        return res.status(response.status).json({ 
          success: false, 
          error: responseData.error?.message || responseText || "Meta Cloud API request failed." 
        });
      }
    } catch (err: any) {
      console.error("Failed to post message to Meta WhatsApp Cloud API:", err);
      return res.status(500).json({ success: false, error: err.message || "Internal server error connecting to Meta." });
    }
  }

  // Option B: Callmebot Free API (Very user-friendly, no card/account setup needed)
  if (provider === 'callmebot' || useCallmebot || (callmebotApikey && callmebotApikey.trim() !== "")) {
    const targetPhone = callmebotPhone || to;
    const finalApikey = callmebotApikey || process.env.CALLMEBOT_API_KEY;

    if (!targetPhone || !finalApikey) {
      return res.status(400).json({ error: "Callmebot configuration requires a recipient phone number and API key." });
    }

    try {
      // Callmebot URL: https://api.callmebot.com/whatsapp.php?phone=[phone_number]&text=[message]&apikey=[apikey]
      // clean phone number from all spaces, plus sign, brackets etc.
      const cleanPhone = targetPhone.replace(/[\s\+\-\(\)]/g, '');
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(body)}&apikey=${finalApikey}`;

      console.log(`Dispatching Callmebot request to phone: ${cleanPhone}`);
      const callmebotRes = await fetch(url);
      const resText = await callmebotRes.text();

      if (callmebotRes.ok) {
        return res.json({ success: true, provider: 'callmebot', details: "Message request sent successfully to Callmebot gateway." });
      } else {
        return res.status(callmebotRes.status).json({ success: false, error: resText || "Callmebot gateway rejected request." });
      }
    } catch (err: any) {
      console.error("Failed to contact Callmebot service:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to contact Callmebot gateway." });
    }
  }

  // Option C: Twilio WhatsApp REST API (Enterprise standard)
  const targetTo = to || process.env.TWILIO_WHATSAPP_NUMBER;
  const finalSid = twilioSid || process.env.TWILIO_ACCOUNT_SID;
  const finalToken = twilioToken || process.env.TWILIO_AUTH_TOKEN;

  if (!targetTo || !finalSid || !finalToken) {
    return res.status(400).json({ 
      error: "Missing credentials. Please configure either WhatsApp Cloud API, Twilio (SID + Token + Recipient), or Callmebot API." 
    });
  }

  // Ensure 'whatsapp:' prefix is active on recipient
  const formattedTo = targetTo.startsWith('whatsapp:') ? targetTo : `whatsapp:${targetTo}`;
  // Ensure 'whatsapp:' prefix is active on sender
  const formattedSender = twilioSender.startsWith('whatsapp:') ? twilioSender : `whatsapp:${twilioSender}`;

  try {
    const authString = Buffer.from(`${finalSid}:${finalToken}`).toString('base64');
    const url = `https://api.twilio.com/2010-04-01/Accounts/${finalSid}/Messages.json`;

    // Construct form-encoded params
    const params = new URLSearchParams();
    params.append('To', formattedTo);
    params.append('From', formattedSender);
    params.append('Body', body);

    console.log(`Dispatching Twilio WhatsApp request from ${formattedSender} to ${formattedTo}`);
    const twilioRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const responseData: any = await twilioRes.json();

    if (twilioRes.ok) {
      return res.json({ success: true, provider: 'twilio', messageSid: responseData.sid });
    } else {
      console.error("Twilio error response:", responseData);
      return res.status(twilioRes.status).json({ success: false, error: responseData.message || "Twilio request failed." });
    }
  } catch (err: any) {
    console.error("Failed to post message to Twilio WhatsApp API:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error." });
  }
});

// WhatsApp Webhook GET Verification for official Cloud API setup
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'aura_whatsapp_verify_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp Webhook verified successfully.');
      return res.status(200).send(challenge);
    } else {
      console.warn('WhatsApp Webhook verification failed.');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
});

// WhatsApp Webhook POST message event receiver for official Cloud API
app.post('/api/whatsapp/webhook', async (req, res) => {
  const body = req.body;

  console.log('WhatsApp Webhook incoming payload:', JSON.stringify(body, null, 2));

  if (body.object) {
    if (
      body.entry &&
      body.entry[0].changes &&
      body.entry[0].changes[0] &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0]
    ) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from; // e.g. "15550192834"
      const msgBody = message.text ? message.text.body : "";
      const senderName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || "User";

      console.log(`Received WhatsApp message from ${senderName} (${from}): "${msgBody}"`);

      if (msgBody && msgBody.trim() !== '') {
        // Trigger AURA AI responder
        const ai = getGeminiClient();
        let replyText = `Hello! I am AURA-9000. I received your message: "${msgBody}". If you'd like to sync tasks or schedule events, type 'add task [details]'.`;

        if (ai) {
          try {
            const aiPrompt = `You are AURA-9000, an ultra-polished, conversational, and helpful AI Cognitive Scheduler. 
The user ${senderName} sent you a message on WhatsApp: "${msgBody}"

Please formulate a helpful, direct response to this message. 
- If they are describing a task or reminder (e.g. "I need to review marketing plans tomorrow at 5 PM"), tell them you have structured/scheduled it on AURA!
- Otherwise, reply with a creative and encouraging scheduling insight or friendly query.
- Keep the response short, direct and friendly (maximum 160 characters).`;

            const model = "gemini-2.5-flash";
            const response = await ai.models.generateContent({
              model: model,
              contents: aiPrompt
            });
            if (response && response.text) {
              replyText = response.text.trim();
            }
          } catch (aiErr) {
            console.error("Failed to generate AI auto-response:", aiErr);
          }
        }

        // Try to reply automatically if we have active credentials!
        const tokenToUse = activeCloudApiToken || process.env.WHATSAPP_CLOUD_API_ACCESS_TOKEN;
        const phoneIdToUse = activeCloudApiPhoneId || process.env.WHATSAPP_CLOUD_API_PHONE_NUMBER_ID;

        if (tokenToUse && phoneIdToUse) {
          try {
            console.log(`Sending auto-reply to ${from} via WhatsApp Cloud API...`);
            const replyUrl = `https://graph.facebook.com/v18.0/${phoneIdToUse}/messages`;
            await fetch(replyUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${tokenToUse}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: from,
                type: "text",
                text: {
                  preview_url: false,
                  body: replyText
                }
              })
            });
            console.log(`Auto-reply sent successfully: "${replyText}"`);
          } catch (replyErr) {
            console.error("Failed to send auto-reply to WhatsApp:", replyErr);
          }
        } else {
          console.warn("Skipping auto-reply: No active WhatsApp Cloud API credentials configured.");
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  } else {
    return res.sendStatus(404);
  }
});

// Keep track of active Telegram settings in-memory for live webhook replies
let activeTelegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
let activeTelegramChatId = process.env.TELEGRAM_CHAT_ID || '';

// Telegram API to send real alerts to physical devices
app.post('/api/telegram/send', async (req, res) => {
  const { body, botToken, chatId } = req.body;

  if (!body) {
    return res.status(400).json({ error: "Message body is required" });
  }

  const finalToken = botToken || activeTelegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
  const finalChatId = chatId || activeTelegramChatId || process.env.TELEGRAM_CHAT_ID;

  if (botToken) activeTelegramBotToken = botToken;
  if (chatId) activeTelegramChatId = chatId;

  if (!finalToken || !finalChatId) {
    return res.status(400).json({ 
      error: "Missing Telegram configuration. Please provide a Bot Token and Chat ID." 
    });
  }

  try {
    const url = `https://api.telegram.org/bot${finalToken}/sendMessage`;
    console.log(`Dispatching Telegram alert to chat ${finalChatId}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: finalChatId,
        text: body,
        parse_mode: 'HTML'
      })
    });

    const responseText = await response.text();
    let responseData: any = {};
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {}

    if (response.ok && responseData.ok) {
      return res.json({ 
        success: true, 
        messageId: responseData.result?.message_id || "unknown_id" 
      });
    } else {
      console.error("Telegram Bot API error response:", responseData);
      return res.status(response.status).json({ 
        success: false, 
        error: responseData.description || responseText || "Telegram request failed." 
      });
    }
  } catch (err: any) {
    console.error("Failed to connect to Telegram Bot API:", err);
    return res.status(500).json({ success: false, error: err.message || "Internal server error connecting to Telegram." });
  }
});

// Telegram webhook updates receiver
app.post('/api/telegram/webhook', async (req, res) => {
  const body = req.body;
  console.log('Telegram Webhook incoming update:', JSON.stringify(body, null, 2));

  // Verify the structure of incoming update has message and text
  if (body && body.message && body.message.text) {
    const chat = body.message.chat;
    const fromId = chat.id;
    const msgText = body.message.text;
    const firstName = chat.first_name || "User";

    console.log(`Telegram message from ${firstName} (${fromId}): "${msgText}"`);

    if (msgText.trim() !== '') {
      // Trigger AURA AI responder
      const ai = getGeminiClient();
      let replyText = `Hello ${firstName}! I am AURA-9000. I received your message: "${msgText}". If you'd like to sync tasks or schedule events, try saying 'add task [details]'.`;

      if (ai) {
        try {
          const aiPrompt = `You are AURA-9000, an ultra-polished, conversational, and helpful AI Cognitive Scheduler. 
The user ${firstName} sent you a message on Telegram: "${msgText}"

Please formulate a helpful, direct response to this message. 
- If they are describing a task, event, or reminder (e.g. "Remember to buy groceries at 6pm"), tell them you have structured/scheduled it on AURA!
- Keep the response short, direct, and friendly (maximum 200 characters). You can use bold HTML (<b>text</b>) if helpful.`;

          const model = "gemini-2.5-flash";
          const response = await ai.models.generateContent({
            model: model,
            contents: aiPrompt
          });
          if (response && response.text) {
            replyText = response.text.trim();
          }
        } catch (aiErr) {
          console.error("Failed to generate Telegram AI auto-response:", aiErr);
        }
      }

      // Automatically reply to user chat if we have an active bot token!
      const tokenToUse = activeTelegramBotToken || process.env.TELEGRAM_BOT_TOKEN;
      if (tokenToUse) {
        try {
          console.log(`Sending auto-reply to Telegram chat ${fromId}...`);
          const replyUrl = `https://api.telegram.org/bot${tokenToUse}/sendMessage`;
          await fetch(replyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              chat_id: fromId,
              text: replyText,
              parse_mode: 'HTML'
            })
          });
          console.log(`Telegram auto-reply sent successfully: "${replyText}"`);
        } catch (replyErr) {
          console.error("Failed to send auto-reply to Telegram:", replyErr);
        }
      } else {
        console.warn("Skipping Telegram auto-reply: No active Bot Token is cached on the server.");
      }
    }
  }

  // Always return 200 to acknowledge webhook receipt
  return res.status(200).send('OK');
});

// Serve frontend assets in development and production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Vite dev middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static file server
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
