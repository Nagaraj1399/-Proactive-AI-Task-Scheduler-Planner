# Remix: Proactive AI Task Scheduler & Planner

An innovative, highly-interactive, full-stack productivity ecosystem powered by **Google Gemini AI**. This application bridges proactive artificial intelligence with task scheduling, automated prioritization, habit reinforcement, and multi-channel communications to help users maximize their daily focus, beat deadlines, and streamline workflows.

---

## 🚀 Core Features

### 1. 📋 Task Prioritizer
- **Smart Matrix Scoring**: Dynamically calculates task priority scores (0–100) based on due date proximity, estimated duration, category urgency, and impact.
- **Synthesized Steps Breakdown**: Automatically breaks large, intimidating tasks into achievable sub-steps with dynamic timing allocations.
- **Intuitive Categories**: Organizes tasks across custom buckets (Work, Personal, Health, Finance, Urgent) with responsive complete/incomplete filters.

### 2. 📅 AI Calendar Scheduler
- **Visual Timelines**: Renders an interactive calendar view displaying scheduled ranges, overlapping slots, and real-time timeline overlays.
- **Auto-Allocation**: Dynamically schedules task sessions around existing commitments to construct an optimized daily itinerary.

### 3. 🤖 Robotic Focus Core
- **Cybernetic Workspace**: An ultra-immersive, high-intensity focus dashboard designed with glowing grid interfaces, metallic visual styles, and neon telemetry.
- **Active Sprint Session**: Keeps users locked into their deep work phase with dedicated step checklists, distraction filters, and animated focus cycles.

### 4. 🔔 Proactive Reminders (Smart Nudges)
- **Multi-Factor Trigger Engine**: Triggers proactive nudges based on temporal milestones, mock geofenced locations, or imminent workload congestion.
- **Instant Actions**: Enables immediate task resolution or snooze functions directly from contextual prompt bubbles.

### 5. 🔥 Habit Coach & Streaks
- **Streak Trackers**: Encourages behavioral consistency for daily and weekly recurring habits with dynamic streak logs and visual heatmaps.
- **Insight Logs**: Delivers supportive coaching advice, success indicators, and behavioral analytics.

### 6. 📨 Unified Workspace Sync
- **Gmail Workspace Sync**: Pulls actionable tasks directly from emails and converts them into structured planner cards.
- **Chat Simulator Integration**: Simulates real-time notification synchronization with **WhatsApp** and **Telegram** channels.
- **Voice Assistant**: Integrated soundwave interactive assistant powered by vocal command interfaces to manage priorities hands-free.

---

## 🛠️ Technical Stack

- **Frontend Core**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build System**: [Vite 6](https://vite.dev/) with rapid compilation speeds
- **Animations & Micro-interactions**: [Motion](https://motion.dev/) (framer-motion v12) for smooth state transitions
- **Styling Architecture**: [Tailwind CSS v4](https://tailwindcss.com/) for a utility-first fluid visual design
- **Icon Library**: [Lucide React](https://lucide.dev/) for a crisp and lightweight icon pack
- **Backend Architecture**: [Express.js](https://expressjs.com/) configured with Vite middleware for local development
- **AI Core Integration**: [@google/genai SDK](https://www.npmjs.com/package/@google/genai) to power smart insights, step generation, and task scheduling

---

## 🗄️ Core Data Models (`/src/types.ts`)

### Task
```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  estimatedDuration: number; // in minutes
  priorityLevel: 'high' | 'medium' | 'low';
  priorityScore: number; // 0 to 100
  priorityReasoning: string;
  status: 'pending' | 'completed' | 'overdue';
  steps: TaskStep[];
  scheduledStart?: string; // ISO timestamp
  scheduledEnd?: string; // ISO timestamp
  createdAt: string;
  completedAt?: string;
}
```

### Habit
```typescript
export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  history: string[]; // List of completed dates
  createdAt: string;
}
```

---

## 📦 Local Installation & Development

To run this full-stack application on your local machine, follow these steps:

1. **Clone the project files** (or extract the downloaded ZIP folder).
2. **Install all dependencies**:
   ```bash
   npm install
   ```
3. **Configure your environment variables**:
   Create a `.env` file in the root folder and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
4. **Launch the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**:
   ```bash
   npm run build
   ```
   Run the production-compiled backend:
   ```bash
   npm start
   ```

---

## 📤 How to Sync & Push this Project to your GitHub Repository

Since the sandbox container does not have raw SSH credentials to write directly to your personal GitHub account, the **Google AI Studio** platform provides a fully integrated, safe, and automated sync-to-GitHub interface.

Follow these simple steps to push all files (including this newly added `Project.md`):

1. **Open the Export Settings**:
   - Locate the **Settings (Gear Icon)** in the upper-right corner of the Google AI Studio page.
2. **Select "Export to GitHub"**:
   - In the menu options, click on **Export to GitHub**.
3. **Authenticate with GitHub**:
   - If prompted, authorize Google AI Studio with your GitHub account.
4. **Choose Repository Options**:
   - Choose whether you want to export to an **existing repository** (such as `Proactive-AI-Task-Scheduler-Planner`) or create a **brand-new repository**.
5. **Confirm and Sync**:
   - Click the **Export** or **Sync** button. AI Studio will pack the updated workspace, including all of your custom tabs like the *Robotic Focus Core*, compile configurations, and this `Project.md` file, and commit them directly to your specified branch.
