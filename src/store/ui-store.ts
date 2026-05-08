import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UIState = {
  quickAddOpen: boolean;
  locale: string;
  currency: string;
  hapticFeedback: boolean;
  setQuickAddOpen: (value: boolean) => void;
  setPreferences: (input: { locale: string; currency: string; hapticFeedback: boolean }) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      quickAddOpen: false,
      locale: 'en-US',
      currency: 'USD',
      hapticFeedback: true,
      setQuickAddOpen: (value) => set({ quickAddOpen: value }),
      setPreferences: ({ locale, currency, hapticFeedback }) => set({ locale, currency, hapticFeedback }),
    }),
    {
      name: 'expense-ui-store',
      partialize: (state) => ({ locale: state.locale, currency: state.currency, hapticFeedback: state.hapticFeedback }),
    },
  ),
);
