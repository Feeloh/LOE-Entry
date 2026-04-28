/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Sidebar } from './components/Navigation';
import { Header } from './components/Header';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import TeamReview from './views/TeamReview';
import Planning from './views/Planning';
import History from './views/History';

function MainApp() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    // Determine initial tab based on role
    if (profile?.role === 'admin') return 'planning';
    return 'dashboard';
  });

  // Effect to handle role switches and unauthorized tabs
  React.useEffect(() => {
    if (profile?.role === 'admin' && activeTab === 'dashboard') {
      setActiveTab('planning');
    }
  }, [profile?.role, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'team-review': return <TeamReview />;
      case 'planning': return <Planning />;
      case 'history': return <History />;
      default: return profile?.role === 'admin' ? <Planning /> : <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      <Sidebar activeId={activeTab} onNavigate={setActiveTab} />
      <div className="flex-1 flex flex-col h-full min-w-0">
        <Header activeId={activeTab} onNavigate={setActiveTab} />
        <main className="flex-1 overflow-hidden">
          <div className="h-full w-full p-8 overflow-y-auto scrollbar-hide">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
