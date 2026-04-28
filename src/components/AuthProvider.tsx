import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { sessionStore } from '../lib/sessionStore';

interface AuthContextType {
  user: { uid: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = sessionStore.get();
    if (data.currentUser) {
      setProfile(data.currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (role: UserRole) => {
    const getMockDisplayName = (r: UserRole) => {
      if (r === 'manager') return 'Sarah Lead';
      if (r === 'admin') return 'Mock Admin';
      if (r === 'employee') return 'John Dev';
      const roleStr = r as string;
      return `Mock ${roleStr.charAt(0).toUpperCase() + roleStr.slice(1)}`;
    };

    const mockUser: UserProfile = {
      uid: `mock_${role}_id`,
      email: `${role}@example.com`,
      displayName: getMockDisplayName(role),
      role: role,
      title: role === 'employee' ? 'Devops Engineer' : undefined
    };
    sessionStore.save({ currentUser: mockUser });
    setProfile(mockUser);
  };

  const logout = async () => {
    sessionStore.clear();
    setProfile(null);
  };

  const switchRole = (role: UserRole) => {
    if (profile) {
      const getMockDisplayName = (r: UserRole) => {
        if (r === 'manager') return 'Sarah Lead';
        if (r === 'admin') return 'Mock Admin';
        if (r === 'employee') return 'John Dev';
        const roleStr = r as string;
        return `Mock ${roleStr.charAt(0).toUpperCase() + roleStr.slice(1)}`;
      };

      const updatedProfile: UserProfile = { 
        ...profile, 
        role, 
        uid: `mock_${role}_id`, 
        email: `${role}@example.com`, 
        displayName: getMockDisplayName(role),
        title: role === 'employee' ? 'Devops Engineer' : undefined
      };
      sessionStore.save({ currentUser: updatedProfile });
      setProfile(updatedProfile);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: profile ? { uid: profile.uid, email: profile.email } : null, 
      profile, 
      loading, 
      login, 
      logout,
      switchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
