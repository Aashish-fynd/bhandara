// lib/navigationStore.ts
import { create } from "zustand";
import { nanoid } from "nanoid";

interface NavigationState {
  stateMap: Record<string, any>;
  createStateKey: () => string;

  setState: (key: string, value: any) => void;
  getState: (key: string) => any;
  clearState: (key: string) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  stateMap: {},

  createStateKey: () => nanoid(),

  setState: (key, value) =>
    set((state) => ({
      stateMap: {
        ...state.stateMap,
        [key]: value
      }
    })),

  getState: (key) => {
    const value = get().stateMap[key];
    set((state) => {
      const newMap = { ...state.stateMap };
      delete newMap[key];
      return { stateMap: newMap };
    });
    return value;
  },

  clearState: (key) =>
    set((state) => {
      const newMap = { ...state.stateMap };
      delete newMap[key];
      return { stateMap: newMap };
    })
}));

export const setNavState = (key: string, value: any) => {
  useNavigationStore.getState().setState(key, value);
};

export const getNavState = (key: string) => {
  return useNavigationStore.getState().getState(key);
};

export const clearNavState = (key: string) => {
  useNavigationStore.getState().clearState(key);
};

export const createNavStateKey = () => {
  return useNavigationStore.getState().createStateKey();
};
