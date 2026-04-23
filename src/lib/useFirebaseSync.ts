import React, { useState, useEffect, useCallback } from 'react';
import { UserData, ClothingItem, Outfit, LogEntry } from '../types';
import { User } from 'firebase/auth';
import { 
  subscribeToUserData, 
  syncAddItem, syncUpdateItem, syncDeleteItem,
  syncAddOutfit, syncUpdateOutfit, syncDeleteOutfit,
  syncAddLog, syncDeleteLog
} from './db';

const initialData: UserData = {
  items: [],
  outfits: [],
  logs: [],
  currentWeather: 'Sunny',
  preferences: [],
};

// Extremely simple shallow equal helper for our entities
function isDifferent(a: any, b: any) {
  if (!a || !b) return true;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return true;
  for (const key of keysA) {
    if (a[key] !== b[key]) {
      // Arrays like weatherTags or itemIds
      if (Array.isArray(a[key]) && Array.isArray(b[key])) {
        if (a[key].length !== b[key].length) return true;
        for (let i = 0; i < a[key].length; i++) {
          if (a[key][i] !== b[key][i]) return true;
        }
      } else {
        return true;
      }
    }
  }
  return false;
}

export function useFirebaseSync(user: User | null, defaultData: UserData) {
  const [data, setLocalData] = useState<UserData>(user ? initialData : defaultData);

  // Load initial data via subscription
  useEffect(() => {
    if (!user) {
      setLocalData(defaultData);
      return;
    }

    const unsub = subscribeToUserData(user, (partialData) => {
      setLocalData(prev => ({ ...prev, ...partialData }));
    });

    return () => unsub();
  }, [user]); // We intentionally do not include defaultData to avoid re-renders

  // Wrapper for setData that calculates diffs and syncs
  const setSyncData = useCallback((action: React.SetStateAction<UserData>) => {
    setLocalData(prev => {
      const next = typeof action === 'function' ? (action as (prev: UserData) => UserData)(prev) : action;
      
      if (user) {
        // Compute Diffs to sync with Firebase
        
        // 1. ITEMS
        const oldItems = prev.items || [];
        const newItems = next.items || [];
        const oldItemsMap = new Map(oldItems.map(i => [i.id, i]));
        const newItemsMap = new Map(newItems.map(i => [i.id, i]));

        newItems.forEach(item => {
          if (!oldItemsMap.has(item.id)) {
            syncAddItem(user, item);
          } else if (isDifferent(item, oldItemsMap.get(item.id))) {
            syncUpdateItem(user, item);
          }
        });
        oldItems.forEach(item => {
          if (!newItemsMap.has(item.id)) {
            syncDeleteItem(user, item.id);
          }
        });

        // 2. OUTFITS
        const oldOutfits = prev.outfits || [];
        const newOutfits = next.outfits || [];
        const oldOutfitsMap = new Map(oldOutfits.map(o => [o.id, o]));
        const newOutfitsMap = new Map(newOutfits.map(o => [o.id, o]));

        newOutfits.forEach(outfit => {
          if (!oldOutfitsMap.has(outfit.id)) {
            syncAddOutfit(user, outfit);
          } else if (isDifferent(outfit, oldOutfitsMap.get(outfit.id))) {
            syncUpdateOutfit(user, outfit);
          }
        });
        oldOutfits.forEach(outfit => {
          if (!newOutfitsMap.has(outfit.id)) {
            syncDeleteOutfit(user, outfit.id);
          }
        });

        // 3. LOGS
        const oldLogs = prev.logs || [];
        const newLogs = next.logs || [];
        const oldLogsMap = new Map(oldLogs.map(l => [l.id, l]));
        const newLogsMap = new Map(newLogs.map(l => [l.id, l]));

        newLogs.forEach(log => {
          if (!oldLogsMap.has(log.id)) {
             syncAddLog(user, log);
          }
        });
        oldLogs.forEach(log => {
          if (!newLogsMap.has(log.id)) {
             syncDeleteLog(user, log.id);
          }
        });
      }

      return next;
    });
  }, [user]);

  return [data, setSyncData] as const;
}
