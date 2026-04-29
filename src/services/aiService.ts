import { GoogleGenAI } from "@google/genai";
import { EffortSubmission, Project, UserRole } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const aiService = {
  async getResourceInsights(data: { submissions: EffortSubmission[], projects: Project[], month: string, role?: UserRole }) {
    const { submissions, projects, month, role } = data;

    // Build context for the AI
    const stats = submissions.map(s => ({
      name: s.userName,
      role: s.userRole,
      allocations: s.allocations.map(a => ({
        project: a.projectName,
        percent: a.plannedPercent
      }))
    }));

    const projectContext = projects.map(p => ({
      name: p.name,
      description: p.description
    }));

    const isAdmin = role === 'admin';
    const isManager = role === 'manager';

    const systemInstruction = `You are a Senior Strategic Advisor at PixelEdge. 
    Analyze the provided LOE (Level of Effort) data for ${month}.
    
    ${isAdmin ? `
    PURPOSE: ORGANIZATION-WIDE STRATEGIC AUDIT (Admin View)
    1. Identify understaffed projects across the entire organization.
    2. Identify underutilized departments or individuals.
    3. Identify "Burnout Risks" (over 100% capacity).
    4. Provide a forecast for future organizational resource needs.
    5. Suggest specific resource distribution between high-level project tracks.
    ` : `
    PURPOSE: TEAM CAPACITY & ALLOCATION AUDIT (Manager View)
    1. Analyze individual workload of each team member listed.
    2. Identify who is "Underworked" (low utilization) vs "Overworked" (at or above capacity).
    3. Suggest specific project allocations for THESE individuals for the next month.
    4. Flag any team members whose skillsets aren't being fully utilized based on their roles.
    5. Provide a succinct "Team Health" summary.
    `}
    
    Data provided:
    - Submissions: ${JSON.stringify(stats)}
    - Projects: ${JSON.stringify(projectContext)}
    
    Format your response in a clear, professional way with bullet points. 
    Use a technical but encouraging tone. Use emojis sparingly for visual hierarchy.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: isAdmin ? "Generate a comprehensive resource health audit." : "Analyze team capacity and suggest next month's project allocations.",
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      return response.text;
    } catch (error) {
      console.error("AI Insights Error:", error);
      return "Unable to generate insights at this time. Please check your data connectivity.";
    }
  },

  async getHistoryChatResponse(data: { history: EffortSubmission[], query: string, username: string }) {
    const { history, query, username } = data;

    const historySummary = history.map(h => ({
      month: h.month,
      allocations: h.allocations.map(a => ({ project: a.projectName, percent: a.plannedPercent })),
      status: h.status
    }));

    const systemInstruction = `You are a Personal Career & Productivity Assistant at PixelEdge. 
    You are helping ${username} analyze their historical Level of Effort (LOE) data.
    
    Data Context:
    ${JSON.stringify(historySummary)}
    
    Guidelines:
    1. Respond to the user's query precisely based on the historical data provided.
    2. Help ${username} find patterns (e.g., "You spend 40% of your time on Project X over the last 3 months").
    3. Keep responses conversational, professional, and encouraging.
    4. If the user asks something unrelated to their work history, politely steer them back to their productivity data.
    5. Use the user's name (${username}) naturally in conversation.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      return response.text;
    } catch (error) {
      console.error("AI History Chat Error:", error);
      return "I'm having trouble accessing your history right now. Please try again in a moment.";
    }
  },

  async getPlanningChatResponse(data: { 
    submissions: EffortSubmission[], 
    projects: Project[], 
    insights: string | null, 
    query: string,
    username: string,
    month: string
  }) {
    const { submissions, projects, insights, query, username, month } = data;

    const context = {
      month,
      projectCount: projects.length,
      submissionCount: submissions.length,
      totalUtilization: submissions.reduce((acc, s) => acc + s.allocations.reduce((a, b) => a + b.plannedPercent, 0), 0) / (submissions.length || 1),
      projects: projects.map(p => ({ name: p.name })),
      topInsights: insights ? insights.substring(0, 1000) : "No strategic insights generated yet."
    };

    const systemInstruction = `You are the Strategic Resource Partner at PixelEdge. 
    You are assisting ${username} with the planning data for ${month}.
    
    Current Environment Data:
    ${JSON.stringify(context)}
    
    Strategic Insights Context:
    ${insights || "Not available"}
    
    Guidelines:
    1. Answer questions about resource allocation, project staffing, and potential imbalances.
    2. Use the "Strategic Insights" as a primary source of truth if available.
    3. If the user asks for specific personnel data, summarize it rather than listing every name if the list is long.
    4. Provide actionable advice for resource redistribution.
    5. Be concise, data-driven, and strategic.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: query,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      return response.text;
    } catch (error) {
      console.error("AI Planning Chat Error:", error);
      return "Strategic systems are currently under maintenance. Please try your query again shortly.";
    }
  }
};
