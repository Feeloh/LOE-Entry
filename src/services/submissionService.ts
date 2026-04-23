import { EffortSubmission, Project, UserRole, Message } from '../types';
import { sessionStore } from '../lib/sessionStore';

export const submissionService = {
  async getSubmissions(userId: string): Promise<EffortSubmission[]> {
    const data = sessionStore.get();
    return data.submissions.filter(s => s.userId === userId);
  },

  async getTeamSubmissions(managerId?: string, month?: string): Promise<EffortSubmission[]> {
    const data = sessionStore.get();
    // In session mode, managers see all submissions for the month
    return data.submissions.filter(s => !month || s.month === month);
  },

  async updateStatus(submissionId: string, status: EffortSubmission['status']): Promise<void> {
    const data = sessionStore.get();
    const sub = data.submissions.find(s => s.id === submissionId);
    if (sub) {
      sub.status = status;
      sub.updatedAt = new Date().toISOString();
      sessionStore.save({ submissions: data.submissions });
    }
  },

  async approveSubmission(submissionId: string): Promise<void> {
    await this.updateStatus(submissionId, 'approved');
  },

  async requestRevision(submissionId: string): Promise<void> {
    await this.updateStatus(submissionId, 'needs_revision');
  },

  async getAdminReport(month: string): Promise<{ submissions: EffortSubmission[], projects: Project[] }> {
    const data = sessionStore.get();
    return {
      submissions: data.submissions.filter(s => s.month === month),
      projects: data.projects
    };
  },

  async saveSubmission(submission: Partial<EffortSubmission>): Promise<void> {
    const data = sessionStore.get();
    const existingIdx = data.submissions.findIndex(s => s.id === submission.id);
    
    const newSubmission = {
      ...submission,
      id: submission.id || Math.random().toString(36).substr(2, 9),
      updatedAt: new Date().toISOString(),
      createdAt: submission.createdAt || new Date().toISOString()
    } as EffortSubmission;

    if (existingIdx >= 0) {
      data.submissions[existingIdx] = newSubmission;
    } else {
      data.submissions.push(newSubmission);
    }

    sessionStore.save({ submissions: data.submissions });
  },

  async updateSubmission(id: string, submission: Partial<EffortSubmission>): Promise<void> {
    await this.saveSubmission({ ...submission, id });
  },

  async createSubmission(submission: Partial<EffortSubmission>): Promise<string> {
    const id = Math.random().toString(36).substr(2, 9);
    await this.saveSubmission({ ...submission, id });
    return id;
  },

  async getCurrentSubmission(userId: string, month: string): Promise<EffortSubmission | null> {
    const data = sessionStore.get();
    return data.submissions.find(s => s.userId === userId && s.month === month) || null;
  },

  async sendMessage(submissionId: string, message: Partial<Message>): Promise<void> {
    const data = sessionStore.get();
    const submission = data.submissions.find(s => s.id === submissionId);
    if (submission) {
      if (!submission.messages) (submission as any).messages = [];
      const newMessage = {
        ...message,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      } as any;
      (submission as any).messages.push(newMessage);
      sessionStore.save({ submissions: data.submissions });
      // Trigger a local storage event to simulate real-time if needed, but for now just polling or standard updates
      window.dispatchEvent(new Event('session_storage_update'));
    }
  },

  subscribeToMessages(submissionId: string, callback: (messages: any[]) => void) {
    const update = () => {
      const data = sessionStore.get();
      const submission = data.submissions.find(s => s.id === submissionId);
      callback((submission as any)?.messages || []);
    };
    
    update();
    window.addEventListener('session_storage_update', update);
    return () => window.removeEventListener('session_storage_update', update);
  },

  async getSubmissionHistory(userId: string): Promise<EffortSubmission[]> {
    const data = sessionStore.get();
    return data.submissions.filter(s => s.userId === userId).sort((a, b) => b.month.localeCompare(a.month));
  },

  async getProjects(): Promise<Project[]> {
    const data = sessionStore.get();
    return data.projects;
  }
};
