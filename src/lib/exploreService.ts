import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXPLORE_ITEMS, ExploreItem } from '../data/exploreData';

const PUBLIC_EXPLORE_STORAGE_KEY = '@givemore_public_explore_v2';

export class ExploreEvents {
  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emitExploreUpdated() {
    this.listeners.forEach((l) => l());
  }
}

export const exploreEvents = new ExploreEvents();

export async function getPublicExploreItems(): Promise<ExploreItem[]> {
  try {
    const json = await AsyncStorage.getItem(PUBLIC_EXPLORE_STORAGE_KEY);
    const published: ExploreItem[] = json ? JSON.parse(json) : [];
    return [...published, ...EXPLORE_ITEMS];
  } catch (err) {
    console.error('Error reading public explore items:', err);
    return EXPLORE_ITEMS;
  }
}

export async function publishItemToExplore(params: {
  imageUrl: string;
  prompt: string;
  model?: string;
  aspectRatio?: string;
}): Promise<ExploreItem> {
  const ratioMap: Record<string, number> = {
    '1:1': 1.0,
    '16:9': 16 / 9,
    '9:16': 9 / 16,
    '4:3': 4 / 3,
  };

  const ratioVal = ratioMap[params.aspectRatio || '1:1'] || 1.0;

  const newItem: ExploreItem = {
    id: `public_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    image: params.imageUrl,
    title: params.prompt.trim().slice(0, 35) || 'Community Generation',
    prompt: params.prompt,
    model: params.model || 'Krea AI v2',
    aspectRatio: params.aspectRatio || '1:1',
    numericRatio: ratioVal,
    dimensions: params.aspectRatio === '16:9' ? '1024 x 576' : params.aspectRatio === '9:16' ? '576 x 1024' : '1024 x 1024',
    seed: Math.floor(Math.random() * 9000000) + 1000000,
    guidanceScale: 7.5,
    category: 'Graphic Art',
    likesCount: 1,
    createdAt: 'Just now',
    isUserPublished: true,
  };

  try {
    const json = await AsyncStorage.getItem(PUBLIC_EXPLORE_STORAGE_KEY);
    const list: ExploreItem[] = json ? JSON.parse(json) : [];
    list.unshift(newItem);
    await AsyncStorage.setItem(PUBLIC_EXPLORE_STORAGE_KEY, JSON.stringify(list));
    exploreEvents.emitExploreUpdated();
  } catch (err) {
    console.error('Error publishing to explore storage:', err);
  }

  return newItem;
}
