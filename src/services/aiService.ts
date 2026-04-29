import { GoogleGenAI } from "@google/genai";
import { EffortSubmission, Project, UserRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const aiService = {
  async getResourceInsights(data: { submissions: EffortSubmission[], projects: Project[], month: string, role?: UserRole }) {
    const { role, month } = data;
    
    // Simulate network delay for demo feel
    await new Promise(resolve => setTimeout(resolve, 2500));

    if (role === 'admin') {
      return `### 📊 Resource Health Audit: ${month} (Strategic View)

**Executive Summary:** Analysis of ${data.submissions.length} submissions reveals an overall organizational utilization of **88%**, with critical imbalances in specialized units.

#### 🚨 Critical Understaffing
*   **Project Hydra:** Currently at 40% target capacity. Risks missing the Q3 release window. 
*   **Legacy Maintenance:** Critical shortage of Frontend expertise; currently operating with 0.5 FTE.

#### 📈 Optimization Opportunities
*   **Design Team:** Operating at 115% capacity. Recommend immediate redistribution of non-core tasks.
*   **DevOps:** 30% "Open to new project" capacity identified. Can be shifted to Project Alpha.

#### 🔮 Foresight Recommendations
*   **Distribution:** Shift 20% of 'Project Beta' backend resources to 'Project Hydra' to stabilize the burn rate.
*   **Hiring:** Predicted deficit in Full-stack Engineers for the upcoming quarter based on the project pipeline.`;
    }

    return `### 👥 Team Capacity Analysis: ${month} (Manager View)

**Team pulse check complete.** Overall morale risk is **LOW**, but distribution efficiency can be improved by **15%**.

#### 👤 Individual Trends
*   **Overworked:** 2 team members are consistently over 100% (High burnout risk).
*   **Underutilized:** 1 individual is currently at 60% capacity; ideal for upcoming Project Gamma sprints.

#### 🎯 Suggested Next Month Allocations
*   **Developer A:** Increase focus on Project Zeta (from 20% to 50%) to replace exiting contractor.
*   **Developer B:** Shift secondary priority to "Skill Development" for the first week.

#### 💬 Communication Warning
*   The team is split across too many concurrent projects. Recommend consolidating "Micro-tasks" into dedicated sprints.`;
  },

  getInsightsTemplate(role: UserRole, month: string) {
    if (role === 'admin') {
      return `### 📊 Strategic Planning: ${month}
**Scanning project metadata...**
*   Comparing planned LOE vs Historical Output.
*   Identifying cross-project dependencies.
*   Calculating organizational bandwidth.`;
    }
    return `### 👥 Team Capacity: ${month}
**Analyzing member submissions...**
*   Checking individual workload balance.
*   Analyzing role-specific coverage.
*   Calculating next month availability.`;
  },

  async getHistoryChatResponse(data: { history: EffortSubmission[], query: string, username: string }) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const q = data.query.toLowerCase();
    if (q.includes('pattern') || q.includes('spend')) {
      return `Based on your last 3 months, ${data.username}, you consistently spend about **45% of your time on Project Alpha**. Interestingly, your 'Open to New Project' time has decreased by 10% since January.`;
    }
    if (q.includes('burnout') || q.includes('overworked')) {
      return `Your average utilization has been **95%**. While high, it's consistent. You haven't reported over 100% in the last 4 months, which is a healthy baseline for someone in your role.`;
    }
    return `I've analyzed your history for ${data.username}. You usually balance 2 main projects and 1 side project. Would you like me to calculate your average allocation for a specific project?`;
  },

  async getPlanningChatResponse(data: { 
    submissions: EffortSubmission[], 
    projects: Project[], 
    insights: string | null, 
    query: string,
    username: string,
    month: string
  }) {
    await new Promise(resolve => setTimeout(resolve, 1800));
    const q = data.query.toLowerCase();

    if (q.includes('staff') || q.includes('under')) {
      return `**Analysis for ${data.month}:** Project Hydra is currently the most understaffed at roughly 40% capacity. Most other projects are hovering around the 85-90% health mark.`;
    }
    if (q.includes('over') || q.includes('100')) {
      return `There are currently **3 team members** allocated at exactly 100%, and one (Senior Architect) at 110%. I recommend decreasing their technical support load to prevent bottlenecking.`;
    }
    return `Looking at the strategic data for ${data.month}, the organization is operating efficiently. My main recommendation would be to finalize the 'Project Gamma' kickoff resources by Friday to avoid resource locking.`;
  }
};
