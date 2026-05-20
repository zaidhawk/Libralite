/**
 * Reading List Management
 * Allows members to save digital and physical books to a "For Later" list
 */

import { ReadingListItem } from '@/types/digital-content';
import { DigitalCatalogManager } from './digital-catalog';

export class ReadingList {
  private items: Map<string, ReadingListItem>;
  private userItems: Map<string, Set<string>>; // userId -> Set of itemIds

  constructor() {
    this.items = new Map();
    this.userItems = new Map();
  }

  addItem(
    userId: string,
    contentId: string,
    isDigital: boolean,
    notes?: string
  ): ReadingListItem {
    const itemId = this.generateItemId();
    const item: ReadingListItem = {
      itemId,
      userId,
      contentId,
      isDigital,
      addedDate: new Date(),
      notes,
    };

    this.items.set(itemId, item);

    if (!this.userItems.has(userId)) {
      this.userItems.set(userId, new Set());
    }
    this.userItems.get(userId)!.add(itemId);

    return item;
  }

  removeItem(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item) {
      return false;
    }

    this.items.delete(itemId);
    this.userItems.get(item.userId)?.delete(itemId);

    return true;
  }

  getItem(itemId: string): ReadingListItem | undefined {
    return this.items.get(itemId);
  }

  getUserItems(userId: string): ReadingListItem[] {
    const itemIds = this.userItems.get(userId);
    if (!itemIds) {
      return [];
    }

    return Array.from(itemIds)
      .map((itemId) => this.items.get(itemId))
      .filter((item): item is ReadingListItem => item !== undefined);
  }

  getDigitalItems(userId: string): ReadingListItem[] {
    return this.getUserItems(userId).filter((item) => item.isDigital);
  }

  getPhysicalItems(userId: string): ReadingListItem[] {
    return this.getUserItems(userId).filter((item) => !item.isDigital);
  }

  updateNotes(itemId: string, notes: string): boolean {
    const item = this.items.get(itemId);
    if (!item) {
      return false;
    }

    item.notes = notes;
    return true;
  }

  hasItem(userId: string, contentId: string): boolean {
    const userItemsList = this.getUserItems(userId);
    return userItemsList.some((item) => item.contentId === contentId);
  }

  removeByContentId(userId: string, contentId: string): boolean {
    const userItemsList = this.getUserItems(userId);
    const item = userItemsList.find((item) => item.contentId === contentId);

    if (!item) {
      return false;
    }

    return this.removeItem(item.itemId);
  }

  clearUserList(userId: string): void {
    const itemIds = this.userItems.get(userId);
    if (!itemIds) {
      return;
    }

    itemIds.forEach((itemId) => this.items.delete(itemId));
    this.userItems.delete(userId);
  }

  private generateItemId(): string {
    return `RL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export class ReadingListManager {
  private readingLists: Map<string, ReadingList>; // One list per user
  private catalogManager: DigitalCatalogManager;

  constructor(catalogManager: DigitalCatalogManager) {
    this.readingLists = new Map();
    this.catalogManager = catalogManager;
  }

  getUserReadingList(userId: string): ReadingList {
    if (!this.readingLists.has(userId)) {
      this.readingLists.set(userId, new ReadingList());
    }
    return this.readingLists.get(userId)!;
  }

  addToReadingList(
    userId: string,
    contentId: string,
    isDigital: boolean,
    notes?: string
  ): ReadingListItem {
    const list = this.getUserReadingList(userId);
    return list.addItem(userId, contentId, isDigital, notes);
  }

  removeFromReadingList(userId: string, itemId: string): boolean {
    const list = this.getUserReadingList(userId);
    return list.removeItem(itemId);
  }

  getReadingListWithDetails(userId: string): Array<{
    item: ReadingListItem;
    contentDetails?: any;
  }> {
    const list = this.getUserReadingList(userId);
    const items = list.getUserItems(userId);

    return items.map((item) => {
      let contentDetails;
      if (item.isDigital) {
        const content = this.catalogManager.getContent(item.contentId);
        contentDetails = content?.getMetadata();
      }

      return {
        item,
        contentDetails,
      };
    });
  }

  moveToTop(userId: string, itemId: string): boolean {
    // This would require ordering logic in the ReadingList class
    // For now, just verify the item exists
    const list = this.getUserReadingList(userId);
    return list.getItem(itemId) !== undefined;
  }

  sortByAddedDate(userId: string, ascending: boolean = false): ReadingListItem[] {
    const list = this.getUserReadingList(userId);
    const items = list.getUserItems(userId);

    return items.sort((a, b) => {
      const diff = a.addedDate.getTime() - b.addedDate.getTime();
      return ascending ? diff : -diff;
    });
  }
}
