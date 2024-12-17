import { create } from 'zustand';
import type { ActivityType, DifficultyLevel } from '../types/database';
import { logger } from '../utils/logger';

interface EventFilters {
  search: string;
  activityType?: ActivityType;
  difficulty?: DifficultyLevel;
  priceRange?: string;
  dateRange?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

interface EventFiltersStore extends EventFilters {
  setSearch: (search: string) => void;
  setActivityType: (type: ActivityType | undefined) => void;
  setDifficulty: (level: DifficultyLevel | undefined) => void;
  setPriceRange: (range: string | undefined) => void;
  setDateRange: (range: string | undefined) => void;
  setLocation: (location: EventFilters['location']) => void;
  reset: () => void;
}

export const useEventFilters = create<EventFiltersStore>((set) => ({
  search: '',
  activityType: undefined,
  difficulty: undefined,
  priceRange: undefined,
  dateRange: undefined,
  location: undefined,
  setSearch: (search) => {
    logger.info('Setting search filter', { search });
    set({ search });
  },
  setActivityType: (activityType) => {
    logger.info('Setting activity type filter', { activityType });
    set({ activityType });
  },
  setDifficulty: (difficulty) => {
    logger.info('Setting difficulty filter', { difficulty });
    set({ difficulty });
  },
  setPriceRange: (priceRange) => {
    logger.info('Setting price range filter', { priceRange });
    set({ priceRange });
  },
  setDateRange: (dateRange) => {
    logger.info('Setting date range filter', { dateRange });
    set({ dateRange });
  },
  setLocation: (location) => {
    logger.info('Setting location filter', { location });
    set({ location });
  },
  reset: () => {
    logger.info('Resetting all filters');
    set({
      search: '',
      activityType: undefined,
      difficulty: undefined,
      priceRange: undefined,
      dateRange: undefined,
      location: undefined,
    });
  },
}));