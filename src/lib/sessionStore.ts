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
        
        initialSubmissions.push(
          {
            id: `sub_${monthStr}_1`,
            userId: 'mock_employee_id',
            userName: 'John Dev',
            userRole: 'employee',
            month: monthStr,
            status: 'needs_revision',
            allocations: [
              { projectId: 'erm', projectName: 'ERM Assess', role: 'Devops Engineer', targetPercent: 0, plannedPercent: 70 },
              { projectId: 'time-off', projectName: 'Time-Off', role: 'Devops Engineer', targetPercent: 0, plannedPercent: 30 }
            ],
            totalHours: 168,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            id: `sub_${monthStr}_2`,
            userId: 'mock_manager_id',
            userName: 'Sarah Lead',
            userRole: 'manager',
            month: monthStr,
            status: 'approved',
            allocations: [
              { projectId: 'bdc', projectName: 'BDC', role: 'Solution Architect', targetPercent: 0, plannedPercent: 50 },
              { projectId: 'erm', projectName: 'ERM Assess', role: 'Technical Lead', targetPercent: 0, plannedPercent: 50 }
            ],
            totalHours: 168,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
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
