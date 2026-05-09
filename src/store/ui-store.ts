import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UIState = {
  quickAddOpen: boolean;
  locale: string;
  currency: string;
  timezone: string;
  hapticFeedback: boolean;
  detectionCompleted: boolean;
  setQuickAddOpen: (value: boolean) => void;
  setPreferences: (input: {
    locale: string;
    currency: string;
    timezone: string;
    hapticFeedback: boolean;
    detectionCompleted?: boolean;
  }) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      quickAddOpen: false,
      locale: 'en-IN',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      hapticFeedback: true,
      detectionCompleted: false,
      setQuickAddOpen: (value) => set({ quickAddOpen: value }),
      setPreferences: ({ locale, currency, timezone, hapticFeedback, detectionCompleted }) =>
        set({
          locale,
          currency,
          timezone,
          hapticFeedback,
          detectionCompleted: detectionCompleted ?? true,
        }),
    }),
    {
      name: 'expense-ui-store',
      partialize: (state) => ({
        locale: state.locale,
        currency: state.currency,
        timezone: state.timezone,
        hapticFeedback: state.hapticFeedback,
        detectionCompleted: state.detectionCompleted,
      }),
    },
  ),
);
