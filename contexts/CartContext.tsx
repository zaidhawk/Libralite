/**
 * Cart Context - Manages borrowing cart state
 */

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DigitalContentMetadata } from '@/types/digital-content';

interface CartItem {
  contentId: string;
  title: string;
  author: string;
  coverImageUrl?: string;
  formatType: string;
  loanPeriodDays: number;
  availableCopies: number;
  totalCopies: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (content: DigitalContentMetadata) => void;
  removeFromCart: (contentId: string) => void;
  updateLoanPeriod: (contentId: string, days: number) => void;
  clearCart: () => void;
  isInCart: (contentId: string) => boolean;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('borrowingCart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('borrowingCart', JSON.stringify(items));
  }, [items]);

  const addToCart = (content: DigitalContentMetadata) => {
    setItems((prev) => {
      // Check if already in cart
      if (prev.some((item) => item.contentId === content.contentId)) {
        return prev;
      }

      return [
        ...prev,
        {
          contentId: content.contentId,
          title: content.title,
          author: content.author,
          coverImageUrl: content.coverImageUrl,
          formatType: content.formatType,
          loanPeriodDays: 14, // Default loan period
          availableCopies: content.availableCopies,
          totalCopies: content.totalCopies,
        },
      ];
    });
  };

  const removeFromCart = (contentId: string) => {
    setItems((prev) => prev.filter((item) => item.contentId !== contentId));
  };

  const updateLoanPeriod = (contentId: string, days: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.contentId === contentId ? { ...item, loanPeriodDays: days } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (contentId: string) => {
    return items.some((item) => item.contentId === contentId);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateLoanPeriod,
        clearCart,
        isInCart,
        cartCount: items.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
