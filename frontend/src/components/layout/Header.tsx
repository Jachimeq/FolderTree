import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Palette, Menu, LogOut, Settings, LogIn } from 'lucide-react';

export function Header() {
  const { isDarkMode, toggleDarkMode, user, logout, sidebarOpen } = useAppStore();

  return (
    <header className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-md border-b border-gray-200 sticky top-0 z-40`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FolderTree
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
            PRO
          </span>
        </div>

        {/* Center - Project Name */}
        <div className="flex-1 text-center hidden md:block">
          <p className="text-sm font-medium opacity-75">My Project</p>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Toggle theme"
          >
            <Palette size={20} />
          </button>

          {/* Settings */}
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Settings">
            <Settings size={20} />
          </button>

          {/* User Menu */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium hidden sm:inline">{user.name}</span>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <LogIn size={18} />
              <span className="hidden sm:inline">Login</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
