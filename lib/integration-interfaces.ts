/**
 * Integration Interfaces for Core Library Systems
 * Defines how digital content integrates with:
 * - Main Catalog (Sub-project 2)
 * - Loan Management System (Sub-project 5)
 * - User Dashboard (Sub-project 4)
 */

import { DigitalContent, DigitalCatalogManager } from './digital-catalog';
import { DigitalLoanManager } from './loan-management';
import { ReadingListManager } from './reading-list';

/**
 * Unified Catalog Interface
 * Combines physical and digital content in a single catalog view
 */
export interface CatalogItem {
  itemId: string;
  title: string;
  author: string;
  type: 'physical' | 'digital';
  isAvailable: boolean;
  availableCopies: number;
  totalCopies: number;
  format?: string;
  location?: string; // For physical books
  coverImageUrl?: string;
}

export class UnifiedCatalogManager {
  private digitalCatalog: DigitalCatalogManager;
  // In a real implementation, would also have PhysicalCatalogManager

  constructor(digitalCatalog: DigitalCatalogManager) {
    this.digitalCatalog = digitalCatalog;
  }

  /**
   * Search both physical and digital catalogs
   */
  searchUnifiedCatalog(
    query: string,
    filters?: {
      type?: 'physical' | 'digital' | 'all';
      availableOnly?: boolean;
      format?: string;
    }
  ): CatalogItem[] {
    const results: CatalogItem[] = [];

    // Add digital items
    if (!filters?.type || filters.type === 'digital' || filters.type === 'all') {
      const digitalItems = this.digitalCatalog.searchCatalog(query, {
        availableOnly: filters?.availableOnly,
      });

      results.push(
        ...digitalItems.map((content) => this.convertDigitalToCatalogItem(content))
      );
    }

    // In real implementation, would also search physical catalog
    // if (!filters?.type || filters.type === 'physical' || filters.type === 'all') {
    //   const physicalItems = this.physicalCatalog.search(query);
    //   results.push(...physicalItems);
    // }

    return results;
  }

  private convertDigitalToCatalogItem(content: DigitalContent): CatalogItem {
    const metadata = content.getMetadata();
    return {
      itemId: metadata.contentId,
      title: metadata.title,
      author: metadata.author,
      type: 'digital',
      isAvailable: content.isAvailable(),
      availableCopies: metadata.availableCopies,
      totalCopies: metadata.totalCopies,
      format: metadata.formatType,
      coverImageUrl: metadata.coverImageUrl,
    };
  }
}

/**
 * Extended Loan Management Interface
 * Handles both physical and digital checkout rules
 */
export interface UnifiedLoan {
  loanId: string;
  itemId: string;
  userId: string;
  type: 'physical' | 'digital';
  checkoutDate: Date;
  dueDate: Date;
  status: 'active' | 'overdue' | 'returned' | 'expired';
  autoReturn?: boolean; // Only for digital
  renewalsRemaining: number;
}

export class UnifiedLoanManager {
  private digitalLoanManager: DigitalLoanManager;
  // In real implementation, would also have PhysicalLoanManager

  constructor(digitalLoanManager: DigitalLoanManager) {
    this.digitalLoanManager = digitalLoanManager;
  }

  /**
   * Get all loans (physical and digital) for a user
   */
  getUserLoans(userId: string): UnifiedLoan[] {
    const loans: UnifiedLoan[] = [];

    // Get digital loans
    const digitalLoans = this.digitalLoanManager.getUserLoans(userId);
    loans.push(
      ...digitalLoans.map((loan) => ({
        loanId: loan.loanId,
        itemId: loan.contentId,
        userId: loan.userId,
        type: 'digital' as const,
        checkoutDate: loan.checkoutDate,
        dueDate: loan.expirationDate,
        status: loan.status as 'active' | 'expired' | 'returned',
        autoReturn: loan.autoReturnScheduled,
        renewalsRemaining: 2, // From LoanRules.MAX_RENEWALS
      }))
    );

    // In real implementation, would also get physical loans
    // const physicalLoans = this.physicalLoanManager.getUserLoans(userId);
    // loans.push(...physicalLoans);

    return loans;
  }

  /**
   * Process checkout for either physical or digital items
   */
  async checkout(
    userId: string,
    itemId: string,
    itemType: 'physical' | 'digital',
    loanPeriodDays: number
  ): Promise<{ success: boolean; loanId?: string; error?: string }> {
    if (itemType === 'digital') {
      const result = await this.digitalLoanManager.checkoutContent({
        contentId: itemId,
        userId,
        loanPeriodDays,
      });

      return {
        success: result.success,
        loanId: result.loanId,
        error: result.error,
      };
    }

    // Handle physical checkout
    return { success: false, error: 'Physical checkout not implemented' };
  }

  /**
   * Check if user can checkout (considering both physical and digital limits)
   */
  canCheckout(userId: string): boolean {
    const loans = this.getUserLoans(userId);
    const activeLoans = loans.filter((loan) => loan.status === 'active');

    // Example: Maximum 20 total loans (10 physical + 10 digital)
    return activeLoans.length < 20;
  }
}

/**
 * Enhanced User Dashboard Interface
 * Displays both physical and digital items with appropriate features
 */
export interface DashboardData {
  userId: string;
  activeLoans: UnifiedLoan[];
  readingList: {
    digital: number;
    physical: number;
    total: number;
  };
  recommendations?: CatalogItem[];
  alerts: DashboardAlert[];
}

export interface DashboardAlert {
  type: 'expiring_soon' | 'overdue' | 'hold_available' | 'new_recommendation';
  message: string;
  itemId?: string;
  actionUrl?: string;
}

export class DashboardManager {
  private unifiedLoanManager: UnifiedLoanManager;
  private readingListManager: ReadingListManager;
  private unifiedCatalog: UnifiedCatalogManager;

  constructor(
    unifiedLoanManager: UnifiedLoanManager,
    readingListManager: ReadingListManager,
    unifiedCatalog: UnifiedCatalogManager
  ) {
    this.unifiedLoanManager = unifiedLoanManager;
    this.readingListManager = readingListManager;
    this.unifiedCatalog = unifiedCatalog;
  }

  /**
   * Get complete dashboard data for a user
   */
  getDashboardData(userId: string): DashboardData {
    const loans = this.unifiedLoanManager.getUserLoans(userId);
    const activeLoans = loans.filter((loan) => loan.status === 'active');

    const readingList = this.readingListManager.getUserReadingList(userId);
    const allItems = readingList.getUserItems(userId);
    const digitalItems = readingList.getDigitalItems(userId);
    const physicalItems = readingList.getPhysicalItems(userId);

    const alerts = this.generateAlerts(activeLoans);

    return {
      userId,
      activeLoans,
      readingList: {
        digital: digitalItems.length,
        physical: physicalItems.length,
        total: allItems.length,
      },
      alerts,
    };
  }

  /**
   * Generate alerts for expiring loans, overdue items, etc.
   */
  private generateAlerts(loans: UnifiedLoan[]): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];
    const now = new Date();

    loans.forEach((loan) => {
      const timeUntilDue = loan.dueDate.getTime() - now.getTime();
      const daysUntilDue = timeUntilDue / (1000 * 60 * 60 * 24);

      // Alert for items expiring within 2 days
      if (daysUntilDue > 0 && daysUntilDue < 2) {
        alerts.push({
          type: 'expiring_soon',
          message: `${loan.type === 'digital' ? 'Digital' : 'Physical'} item expiring in ${Math.ceil(daysUntilDue)} day(s)`,
          itemId: loan.itemId,
        });
      }

      // Alert for overdue items (mainly for physical)
      if (daysUntilDue < 0 && loan.type === 'physical') {
        alerts.push({
          type: 'overdue',
          message: `Item is ${Math.abs(Math.floor(daysUntilDue))} day(s) overdue`,
          itemId: loan.itemId,
        });
      }
    });

    return alerts;
  }
}
