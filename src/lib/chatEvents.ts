import { ChatItem } from './chatService';

export type ChatEvent = 
  | { type: 'NEW_CHAT' }
  | { type: 'LOAD_CHAT'; chat: ChatItem }
  | { type: 'CHAT_SAVED' };

type Listener = (event: ChatEvent) => void;

const listeners: Set<Listener> = new Set();

export const chatEvents = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emitNewChat() {
    listeners.forEach(l => l({ type: 'NEW_CHAT' }));
  },
  emitLoadChat(chat: ChatItem) {
    listeners.forEach(l => l({ type: 'LOAD_CHAT', chat }));
  },
  emitChatSaved() {
    listeners.forEach(l => l({ type: 'CHAT_SAVED' }));
  }
};
