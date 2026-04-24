import { EffortSubmission, Project, UserProfile, UserRole } from '../types';

const SESSION_KEY = 'resource_core_session_data';

interface SessionData {
  submissions: EffortSubmission[];
  projects: Project[];
  currentUser: UserProfile | null;
}

const DEFAULT_PROJECTS: Project[] = [
  { id: 'erm', name: 'ERM Assess', description: 'Enterprise Risk Management Assessment', status: 'active' },
  { id: 'bdc', name: 'BDC', description: 'Business Development Council', status: 'active' },
  { id: 'angle', name: 'AngleCatalyst', description: 'Internal Growth Initiative', status: 'active' },
  { id: 'time-off', name: 'Time-Off (PTO / Holidays)', status: 'active' },
  { id: 'open-project', name: 'Open to New Project', status: 'active' }
];

export const sessionStore = {
  get: (): SessionData => {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) {
      const today = new Date();
      const initialSubmissions: EffortSubmission[] = [];
      
      // Generate some submissions for current and past 3 months
      for (let i = 0; i <= 3; i++) {
        const d = new Date();
        d.setMonth(today.getMonth() - i);
        const monthStr = d.toISOString().slice(0, 7);
        const monthName = new Date(monthStr).toLocaleDateString([], { month: 'long' });
        
        // Define varied allocations for March specifically
        let employeeAllocations = [
          { projectId: 'erm', projectName: 'ERM Assess', role: 'Devops Engineer', targetPercent: 0, plannedPercent: 70 },
          { projectId: 'time-off', projectName: 'Time-Off', role: 'Devops Engineer', targetPercent: 0, plannedPercent: 30 }
        ];

        let leadAllocations = [
          { projectId: 'bdc', projectName: 'BDC', role: 'Solution Architect', targetPercent: 0, plannedPercent: 50 },
          { projectId: 'erm', projectName: 'ERM Assess', role: 'Technical Lead', targetPercent: 0, plannedPercent: 50 }
        ];

        if (monthStr === '2026-03') {
          employeeAllocations = [
            { projectId: 'angle', projectName: 'AngleCatalyst', role: 'Senior Developer', targetPercent: 0, plannedPercent: 60 },
            { projectId: 'bdc', projectName: 'BDC', role: 'Support Engineer', targetPercent: 0, plannedPercent: 40 }
          ];
          leadAllocations = [
            { projectId: 'angle', projectName: 'AngleCatalyst', role: 'Manager', targetPercent: 0, plannedPercent: 40 },
            { projectId: 'bdc', projectName: 'BDC', role: 'Solution Architect', targetPercent: 0, plannedPercent: 60 }
          ];
        }

        initialSubmissions.push(
          {
            id: `sub_${monthStr}_1`,
            userId: 'mock_employee_id',
            userName: 'John Dev',
            userRole: 'employee',
            month: monthStr,
            status: monthStr === new Date().toISOString().slice(0, 7) ? 'needs_revision' : 'approved',
            allocations: employeeAllocations,
            totalHours: 168,
            messages: [
              {
                id: `msg_${monthStr}_1`,
                senderId: 'admin_user',
                senderName: 'Admin',
                content: `The LOE reporting cycle for ${monthName} ${new Date(monthStr).getFullYear()} is now officially open. Please ensure all project allocations are accurately reflected before the submission deadline.`,
                timestamp: new Date(new Date(monthStr).getTime() + 86400000).toISOString()
              },
              {
                id: `msg_${monthStr}_2`,
                senderId: 'mock_manager_id',
                senderName: 'Team Lead',
                content: monthStr === '2026-03' 
                  ? "John, good job on the AngleCatalyst sprint last month. Let's keep the momentum for BDC as well."
                  : "Team, please verify your billable percentages against the project roadmaps.",
                timestamp: new Date(new Date(monthStr).getTime() + 172800000).toISOString()
              }
            ],
            updatedAt: new Date(monthStr).toISOString(),
            createdAt: new Date(monthStr).toISOString()
          },
          {
            id: `sub_${monthStr}_2`,
            userId: 'mock_manager_id',
            userName: 'Sarah Lead',
            userRole: 'manager',
            month: monthStr,
            status: 'approved',
            allocations: leadAllocations,
            totalHours: 168,
            messages: [
              {
                id: `msg_lead_${monthStr}_1`,
                senderId: 'admin_user',
                senderName: 'Admin',
                content: monthStr === '2026-03'
                  ? `Sarah, the March BDC delivery looks heavy. Are you comfortable with this 60% lead role?`
                  : `Hi Sarah, I noticed your BDC allocation is at 50% for ${monthName}. Is this expected?`,
                timestamp: new Date(new Date(monthStr).getTime() + 86400000).toISOString()
              },
              {
                id: `msg_lead_${monthStr}_2`,
                senderId: 'mock_manager_id',
                senderName: 'Sarah Lead',
                content: monthStr === '2026-03'
                  ? "It's tight, but necessary for the Q1 wrap-up. I have reduced my AngleCatalyst advisory load to compensate."
                  : "Yes, BDC is entering its final architectural review phase. I need to be heavily involved.",
                timestamp: new Date(new Date(monthStr).getTime() + 172800000).toISOString()
              }
            ],
            updatedAt: new Date(monthStr).toISOString(),
            createdAt: new Date(monthStr).toISOString()
          },
          {
            id: `sub_${monthStr}_3`,
            userId: 'admin_user',
            userName: 'Admin User',
            userRole: 'admin',
            month: monthStr,
            status: 'approved',
            allocations: [
              { projectId: 'angle', projectName: 'AngleCatalyst', role: 'Advisory', targetPercent: 0, plannedPercent: 20 },
              { projectId: 'open-project', projectName: 'Open to New Project', role: 'Advisory', targetPercent: 0, plannedPercent: 80 }
            ],
            totalHours: 168,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        );
      }

      return {
        submissions: initialSubmissions,
        projects: DEFAULT_PROJECTS,
        currentUser: null
      };
    }
    return JSON.parse(data);
  },

  save: (data: Partial<SessionData>) => {
    const current = sessionStore.get();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...data }));
  },

  clear: () => {
    localStorage.removeItem(SESSION_KEY);
  }
};
