/**
 * Firebase User Data Service
 * Handles persisting user-specific data (loans, reading list/wishlist) to Firestore
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/src/firebase';

// Types
export interface UserLoan {
  id?: string;
  contentId: string;
  title: string;
  author: string;
  coverImageUrl?: string;
  formatType: string;
  checkoutDate: Timestamp;
  expirationDate: Timestamp;
  status: 'active' | 'returned' | 'expired';
}

export interface WishlistItem {
  id?: string;
  contentId: string;
  title: string;
  author: string;
  coverImageUrl?: string;
  formatType: string;
  isDigital: boolean;
  addedDate: Timestamp;
  notes?: string;
}

export interface UserData {
  email: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User Profile
export async function createUserProfile(userId: string, email: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

export async function getUserProfile(userId: string): Promise<UserData | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserData;
  }
  return null;
}

// Loans
export async function addLoan(userId: string, loan: Omit<UserLoan, 'id'>): Promise<string> {
  const loansRef = collection(db, 'users', userId, 'loans');
  const docRef = await addDoc(loansRef, {
    ...loan,
    checkoutDate: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserLoans(userId: string): Promise<UserLoan[]> {
  const loansRef = collection(db, 'users', userId, 'loans');
  const snapshot = await getDocs(loansRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as UserLoan));
}

export async function getActiveUserLoans(userId: string): Promise<UserLoan[]> {
  const loansRef = collection(db, 'users', userId, 'loans');
  const q = query(loansRef, where('status', '==', 'active'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as UserLoan));
}

export async function updateLoanStatus(
  userId: string,
  loanId: string,
  status: 'active' | 'returned' | 'expired'
): Promise<void> {
  const loanRef = doc(db, 'users', userId, 'loans', loanId);
  await updateDoc(loanRef, { status });
}

export async function returnLoan(userId: string, loanId: string): Promise<void> {
  await updateLoanStatus(userId, loanId, 'returned');
}

// Wishlist / Reading List
export async function addToWishlist(userId: string, item: Omit<WishlistItem, 'id' | 'addedDate'>): Promise<string> {
  const wishlistRef = collection(db, 'users', userId, 'wishlist');
  
  // Sanitize data
  const sanitizedItem = {
    contentId: item.contentId,
    title: item.title || 'Unknown Title',
    author: item.author || 'Unknown Author',
    coverImageUrl: item.coverImageUrl || null, // Use null instead of undefined
    formatType: item.formatType || 'UNKNOWN',
    isDigital: item.isDigital,
    notes: item.notes || '', // Use empty string instead of undefined
    addedDate: serverTimestamp()
  };
  
  const docRef = await addDoc(wishlistRef, sanitizedItem);
  return docRef.id;
}

export async function getUserWishlist(userId: string): Promise<WishlistItem[]> {
  const wishlistRef = collection(db, 'users', userId, 'wishlist');
  const snapshot = await getDocs(wishlistRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as WishlistItem));
}

export async function removeFromWishlist(userId: string, itemId: string): Promise<void> {
  const itemRef = doc(db, 'users', userId, 'wishlist', itemId);
  await deleteDoc(itemRef);
}

export async function isInWishlist(userId: string, contentId: string): Promise<boolean> {
  const wishlistRef = collection(db, 'users', userId, 'wishlist');
  const q = query(wishlistRef, where('contentId', '==', contentId));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function getWishlistItemByContentId(userId: string, contentId: string): Promise<WishlistItem | null> {
  const wishlistRef = collection(db, 'users', userId, 'wishlist');
  const q = query(wishlistRef, where('contentId', '==', contentId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as WishlistItem;
}

export async function updateWishlistNotes(userId: string, itemId: string, notes: string): Promise<void> {
  const itemRef = doc(db, 'users', userId, 'wishlist', itemId);
  await updateDoc(itemRef, { notes });
}

// Check if user has active loan for content
export async function hasActiveLoan(userId: string, contentId: string): Promise<boolean> {
  const loansRef = collection(db, 'users', userId, 'loans');
  const q = query(
    loansRef,
    where('contentId', '==', contentId),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}
