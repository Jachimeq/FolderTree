import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { PlanResult, CleanupPlan, OrganizeResult, ReorganizePlan } from '../api/ops';

export interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: { id: string; email: string; name: string } | null;
  token: string | null;

  // Current project
  currentProject: { id: string; name: string } | null;
  tree: any;

  // Plan & cleanup state
  currentPlan: PlanResult | null;
  currentCleanupPlan: CleanupPlan | null;
  selectedCleanupPaths: string[];
  currentOrganizeAnalysis: OrganizeResult | null;
  currentReorganizePlan: ReorganizePlan | null;

  // UI state
  isDarkMode: boolean;
  sidebarOpen: boolean;
  selectedNodes: string[];

  // Collaborators
  activeUsers: any[];

  // Actions
  setUser: (user: AppState['user'], token: string) => void;
  logout: () => void;
  setCurrentProject: (project: AppState['currentProject']) => void;
  setTree: (tree: any) => void;
  setPlan: (plan: PlanResult | null) => void;
  setCleanupPlan: (plan: CleanupPlan | null) => void;
  toggleCleanupPath: (path: string) => void;
  clearCleanupSelection: () => void;
  setOrganizeAnalysis: (analysis: OrganizeResult | null) => void;
  setReorganizePlan: (plan: ReorganizePlan | null) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  selectNodes: (ids: string[]) => void;
  setActiveUsers: (users: any[]) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        isAuthenticated: false,
        user: null,
        token: null,
        currentProject: null,
        tree: {},
        currentPlan: null,
        currentCleanupPlan: null,
        selectedCleanupPaths: [],
        currentOrganizeAnalysis: null,
        currentReorganizePlan: null,
        isDarkMode: false,
        sidebarOpen: true,
        selectedNodes: [],
        activeUsers: [],

        setUser: (user, token) =>
          set({
            user,
            token,
            isAuthenticated: !!user,
          }),

        logout: () =>
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          }),

        setCurrentProject: (project) => set({ currentProject: project }),
        setTree: (tree) => set({ tree }),
        setPlan: (plan) => set({ currentPlan: plan }),
        setCleanupPlan: (plan) => set({ currentCleanupPlan: plan, selectedCleanupPaths: [] }),
        toggleCleanupPath: (path) =>
          set((state) => {
            const selected = state.selectedCleanupPaths.includes(path)
              ? state.selectedCleanupPaths.filter((p) => p !== path)
              : [...state.selectedCleanupPaths, path];
            return { selectedCleanupPaths: selected };
          }),
        clearCleanupSelection: () => set({ selectedCleanupPaths: [] }),
        setOrganizeAnalysis: (analysis) => set({ currentOrganizeAnalysis: analysis }),
        setReorganizePlan: (plan) => set({ currentReorganizePlan: plan }),
        toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        selectNodes: (ids) => set({ selectedNodes: ids }),
        setActiveUsers: (users) => set({ activeUsers: users }),
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          isDarkMode: state.isDarkMode,
          sidebarOpen: state.sidebarOpen,
          token: state.token,
          user: state.user,
        }),
      }
    )
  )
);
