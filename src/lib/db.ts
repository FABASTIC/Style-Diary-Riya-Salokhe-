import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { ClothingItem, Outfit, LogEntry, UserData } from '../types';
import { User } from 'firebase/auth';

export function handleFirestoreError(error: any, operationType: string, path: string | null, user: User | null) {
  const errorInfo = {
    error: error.message || 'Unknown error',
    operationType,
    path,
    authInfo: user ? {
      userId: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      providerInfo: user.providerData
    } : null
  };
  throw new Error(JSON.stringify(errorInfo));
}

export const subscribeToUserData = (user: User, onUpdate: (data: Partial<UserData>) => void) => {
  const itemsQuery = query(collection(db, 'users', user.uid, 'items'), where('userId', '==', user.uid));
  const outfitsQuery = query(collection(db, 'users', user.uid, 'outfits'), where('userId', '==', user.uid));
  const logsQuery = query(collection(db, 'users', user.uid, 'logs'), where('userId', '==', user.uid));

  const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClothingItem));
    onUpdate({ items });
  }, (error) => {
    console.error("Error listening to items", error);
  });

  const unsubscribeOutfits = onSnapshot(outfitsQuery, (snapshot) => {
    const outfits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Outfit));
    onUpdate({ outfits });
  }, (error) => {
    console.error("Error listening to outfits", error);
  });

  const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogEntry));
    onUpdate({ logs });
  }, (error) => {
    console.error("Error listening to logs", error);
  });

  return () => {
    unsubscribeItems();
    unsubscribeOutfits();
    unsubscribeLogs();
  };
}

export const syncAddItem = async (user: User, item: ClothingItem) => {
  const itemRef = doc(db, 'users', user.uid, 'items', item.id);
  const dataToSave = { ...item };
  delete (dataToSave as any).id; // Make sure we delete id
  try {
    await setDoc(itemRef, {
      ...dataToSave,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, 'create', itemRef.path, user);
  }
}

export const syncUpdateItem = async (user: User, item: ClothingItem) => {
  const itemRef = doc(db, 'users', user.uid, 'items', item.id);
  const dataToSave = { ...item };
  delete (dataToSave as any).id;
  delete (dataToSave as any).createdAt; // don't override createdAt
  delete (dataToSave as any).userId;    // don't override userId
  try {
    await updateDoc(itemRef, dataToSave);
  } catch (err) {
    handleFirestoreError(err, 'update', itemRef.path, user);
  }
}

export const syncDeleteItem = async (user: User, id: string) => {
  const itemRef = doc(db, 'users', user.uid, 'items', id);
  try {
    await deleteDoc(itemRef);
  } catch (err) {
    handleFirestoreError(err, 'delete', itemRef.path, user);
  }
}

export const syncAddOutfit = async (user: User, outfit: Outfit) => {
  const outfitRef = doc(db, 'users', user.uid, 'outfits', outfit.id);
  const dataToSave = { ...outfit };
  delete (dataToSave as any).id;
  try {
    await setDoc(outfitRef, {
      ...dataToSave,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, 'create', outfitRef.path, user);
  }
}

export const syncUpdateOutfit = async (user: User, outfit: Outfit) => {
  const outfitRef = doc(db, 'users', user.uid, 'outfits', outfit.id);
  const dataToSave = { ...outfit };
  delete (dataToSave as any).id;
  delete (dataToSave as any).createdAt;
  delete (dataToSave as any).userId;
  try {
    await updateDoc(outfitRef, dataToSave);
  } catch (err) {
    handleFirestoreError(err, 'update', outfitRef.path, user);
  }
}

export const syncDeleteOutfit = async (user: User, id: string) => {
  const outfitRef = doc(db, 'users', user.uid, 'outfits', id);
  try {
    await deleteDoc(outfitRef);
  } catch (err) {
    handleFirestoreError(err, 'delete', outfitRef.path, user);
  }
}

export const syncAddLog = async (user: User, log: LogEntry) => {
  const logRef = doc(db, 'users', user.uid, 'logs', log.id);
  const dataToSave = { ...log };
  delete (dataToSave as any).id;
  try {
    await setDoc(logRef, {
      ...dataToSave,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, 'create', logRef.path, user);
  }
}

export const syncDeleteLog = async (user: User, id: string) => {
  const logRef = doc(db, 'users', user.uid, 'logs', id);
  try {
    await deleteDoc(logRef);
  } catch (err) {
    handleFirestoreError(err, 'delete', logRef.path, user);
  }
}
