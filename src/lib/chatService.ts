import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

export interface ChatItem {
  id: string;
  title: string;
  prompt: string;
  activePrompt: string | null;
  imageUrl: string | null;
  model: string;
  aspectRatio: string;
  quality: string;
  referenceImages: string[];
  canvasRegions: any[];
  createdAt: string;
}

const STORAGE_KEY = '@givemore_chats_history_v1';

let dbPromise: Promise<any> | null = null;

async function getSQLiteDb() {
  if (Platform.OS === 'web') return null;
  if (!dbPromise) {
    dbPromise = (async () => {
      try {
        const SQLite = await import('expo-sqlite');
        const db = await SQLite.openDatabaseAsync('givemore_chats.db');
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS chats (
            id TEXT PRIMARY KEY NOT NULL,
            title TEXT NOT NULL,
            prompt TEXT,
            active_prompt TEXT,
            image_url TEXT,
            model TEXT,
            aspect_ratio TEXT,
            quality TEXT,
            reference_images TEXT,
            canvas_regions TEXT,
            created_at TEXT NOT NULL
          );
        `);
        return db;
      } catch (e) {
        console.warn('SQLite init fallback to AsyncStorage', e);
        return null;
      }
    })();
  }
  return dbPromise;
}

async function safeStorageGetItem(key: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return AsyncStorage.getItem(key);
}

async function safeStorageSetItem(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return;
  return AsyncStorage.setItem(key, value);
}

export async function saveChat(chat: ChatItem): Promise<void> {
  if (!chat.id) return;
  const rawTitle = (chat.prompt || chat.activePrompt || 'New generation').trim();
  const title = rawTitle.slice(0, 45) || 'Untitled Generation';
  const chatToSave: ChatItem = { ...chat, title };

  try {
    const db = await getSQLiteDb();
    if (db) {
      await db.runAsync(
        `INSERT OR REPLACE INTO chats 
        (id, title, prompt, active_prompt, image_url, model, aspect_ratio, quality, reference_images, canvas_regions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          chatToSave.id,
          chatToSave.title,
          chatToSave.prompt || '',
          chatToSave.activePrompt || '',
          chatToSave.imageUrl || '',
          chatToSave.model || 'krea2',
          chatToSave.aspectRatio || '1:1',
          chatToSave.quality || 'Balanced',
          JSON.stringify(chatToSave.referenceImages || []),
          JSON.stringify(chatToSave.canvasRegions || []),
          chatToSave.createdAt || new Date().toISOString()
        ]
      );
    } else {
      const stored = await safeStorageGetItem(STORAGE_KEY);
      let list: ChatItem[] = stored ? JSON.parse(stored) : [];
      const index = list.findIndex(c => c.id === chatToSave.id);
      if (index >= 0) {
        list[index] = chatToSave;
      } else {
        list.unshift(chatToSave);
      }
      await safeStorageSetItem(STORAGE_KEY, JSON.stringify(list));
    }

    // Supabase sync (graceful catch if network offline or table not present)
    try {
      if (process.env.EXPO_PUBLIC_SUPABASE_URL && supabase) {
        await supabase.from('chats').upsert({
          id: chatToSave.id,
          title: chatToSave.title,
          prompt: chatToSave.prompt,
          active_prompt: chatToSave.activePrompt,
          image_url: chatToSave.imageUrl,
          model: chatToSave.model,
          aspect_ratio: chatToSave.aspectRatio,
          quality: chatToSave.quality,
          reference_images: chatToSave.referenceImages,
          canvas_regions: chatToSave.canvasRegions,
          created_at: chatToSave.createdAt
        });
      }
    } catch {
      // Ignore network / table errors for local resilience
    }
  } catch (err) {
    console.error('Error saving chat to database:', err);
  }
}

export async function getChats(limit: number = 10, offset: number = 0): Promise<ChatItem[]> {
  try {
    const db = await getSQLiteDb();
    if (db) {
      const rows: any[] = await db.getAllAsync(
        `SELECT * FROM chats ORDER BY created_at DESC LIMIT ? OFFSET ?;`,
        [limit, offset]
      );
      return rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        prompt: r.prompt,
        activePrompt: r.active_prompt,
        imageUrl: r.image_url,
        model: r.model,
        aspectRatio: r.aspect_ratio,
        quality: r.quality,
        referenceImages: r.reference_images ? JSON.parse(r.reference_images) : [],
        canvasRegions: r.canvas_regions ? JSON.parse(r.canvas_regions) : [],
        createdAt: r.created_at
      }));
    } else {
      const stored = await safeStorageGetItem(STORAGE_KEY);
      const list: ChatItem[] = stored ? JSON.parse(stored) : [];
      return list.slice(offset, offset + limit);
    }
  } catch (err) {
    console.error('Error getting chats from database:', err);
    return [];
  }
}
