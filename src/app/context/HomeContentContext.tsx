import { createContext, useContext } from 'react';
import type { HomeContent } from '@/types/homeContent';
import homeContentDefault from '@/data/home-content.json';

export const HomeContentContext = createContext<HomeContent>(
  homeContentDefault as HomeContent,
);

export function useHomeContentValue(): HomeContent {
  return useContext(HomeContentContext);
}
