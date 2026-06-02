/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { TodoListView } from './components/TodoListView';
import { SosmedView } from './components/SosmedView';
import { OmsetView } from './components/OmsetView';
import { TeamView } from './components/TeamView';
import { SettingsView } from './components/SettingsView';
import { LoginGateModal } from './components/LoginGateModal';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Render the selected view
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'todos':
        return <TodoListView />;
      case 'sosmed':
        return <SosmedView />;
      case 'omset':
        return <OmsetView />;
      case 'team':
        return <TeamView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Sidebar for Desktop */}
      <div className="hidden lg:flex lg:relative h-full">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Mobile Hamburger Overlay & Sidebar Drawer */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-40 bg-white dark:bg-slate-900 lg:hidden"
            >
              <div className="absolute right-4 top-4 z-50">
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 px-2 rounded-md bg-slate-800 text-gray-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setIsMobileSidebarOpen(false);
                }} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Topbar inside containing mobile menu toggle */}
        <div className="flex items-center w-full">
          <button
            id="mobile-menu-toggle"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-3 ml-2 hover:bg-gray-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg shrink-0"
            title="Menu Navigasi"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <Topbar activeTab={activeTab} />
          </div>
        </div>

        {/* Dynamic active view widget */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DashboardLayout />
      <LoginGateModal />
    </AppProvider>
  );
}
