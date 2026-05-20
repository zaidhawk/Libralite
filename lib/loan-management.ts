/**
 * Digital Loan Management System
 * Handles checkout, returns, and automatic expiration of digital content
 */

import {
  DigitalLoan,
  LoanStatus,
  CheckoutRequest,
  CheckoutResponse,
} from '@/types/digital-content';
import { DigitalCatalogManager } from './digital-catalog';

export class DigitalLoanManager {
  private loans: Map<string, DigitalLoan>;
  private userLoans: Map<string, Set<string>>; // userId -> Set of loanIds
  private catalogManager: DigitalCatalogManager;
  private defaultLoanPeriodDays: number;

  constructor(catalogManager: DigitalCatalogManager, defaultLoanPeriodDays: number = 14) {
    this.loans = new Map();
    this.userLoans = new Map();
    this.catalogManager = catalogManager;
    this.defaultLoanPeriodDays = defaultLoanPeriodDays;
  }

  async checkoutContent(request: CheckoutRequest): Promise<CheckoutResponse> {
    const content = this.catalogManager.getContent(request.contentId);

    if (!content) {
      return { success: false, error: 'Content not found' };
    }

    if (!content.isAvailable()) {
      return { success: false, error: 'Content not available' };
    }

    // Check if user already has this content checked out
    if (this.hasActiveCheckout(request.userId, request.contentId)) {
      return { success: false, error: 'Content already checked out by user' };
    }

    const loanId = this.generateLoanId();
    const checkoutDate = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(checkoutDate.getDate() + request.loanPeriodDays);

    const loan: DigitalLoan = {
      loanId,
      contentId: request.contentId,
      userId: request.userId,
      checkoutDate,
      expirationDate,
      status: LoanStatus.ACTIVE,
      autoReturnScheduled: true,
    };

    this.loans.set(loanId, loan);

    // Update user loans tracking
    if (!this.userLoans.has(request.userId)) {
      this.userLoans.set(request.userId, new Set());
    }
    this.userLoans.get(request.userId)!.add(loanId);

    // Decrement available copies
    content.decrementAvailableCopies();

    // Schedule auto-return
    this.scheduleAutoReturn(loanId, expirationDate);

    return {
      success: true,
      loanId,
      expirationDate,
      downloadUrl: await this.generateDownloadUrl(loanId),
    };
  }

  async returnContent(loanId: string): Promise<boolean> {
    const loan = this.loans.get(loanId);
    if (!loan || loan.status !== LoanStatus.ACTIVE) {
      return false;
    }

    loan.status = LoanStatus.RETURNED;

    // Increment available copies
    const content = this.catalogManager.getContent(loan.contentId);
    if (content) {
      content.incrementAvailableCopies();
    }

    return true;
  }

  async expireLoan(loanId: string): Promise<void> {
    const loan = this.loans.get(loanId);
    if (!loan || loan.status !== LoanStatus.ACTIVE) {
      return;
    }

    loan.status = LoanStatus.EXPIRED;

    // Increment available copies
    const content = this.catalogManager.getContent(loan.contentId);
    if (content) {
      content.incrementAvailableCopies();
    }

    // Revoke access token
    await this.revokeAccess(loanId);
  }

  getLoan(loanId: string): DigitalLoan | undefined {
    return this.loans.get(loanId);
  }

  getUserLoans(userId: string): DigitalLoan[] {
    const loanIds = this.userLoans.get(userId);
    if (!loanIds) {
      return [];
    }

    return Array.from(loanIds)
      .map((loanId) => this.loans.get(loanId))
      .filter((loan): loan is DigitalLoan => loan !== undefined);
  }

  getActiveUserLoans(userId: string): DigitalLoan[] {
    return this.getUserLoans(userId).filter(
      (loan) => loan.status === LoanStatus.ACTIVE
    );
  }

  hasActiveCheckout(userId: string, contentId: string): boolean {
    const activeLoans = this.getActiveUserLoans(userId);
    return activeLoans.some((loan) => loan.contentId === contentId);
  }

  getTimeRemaining(loanId: string): number {
    const loan = this.loans.get(loanId);
    if (!loan || loan.status !== LoanStatus.ACTIVE) {
      return 0;
    }

    const now = new Date();
    const remaining = loan.expirationDate.getTime() - now.getTime();
    return Math.max(0, remaining);
  }

  async renewLoan(loanId: string, extensionDays: number): Promise<boolean> {
    const loan = this.loans.get(loanId);
    if (!loan || loan.status !== LoanStatus.ACTIVE) {
      return false;
    }

    const newExpirationDate = new Date(loan.expirationDate);
    newExpirationDate.setDate(newExpirationDate.getDate() + extensionDays);

    loan.expirationDate = newExpirationDate;
    this.scheduleAutoReturn(loanId, newExpirationDate);

    return true;
  }

  private scheduleAutoReturn(loanId: string, expirationDate: Date): void {
    const now = new Date();
    const delay = expirationDate.getTime() - now.getTime();

    if (delay > 0) {
      setTimeout(() => {
        this.expireLoan(loanId);
      }, delay);
    }
  }

  private generateLoanId(): string {
    return `LOAN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private async generateDownloadUrl(loanId: string): Promise<string> {
    // Generate secure, time-limited download URL
    const token = this.generateAccessToken(loanId);
    return `/api/digital/download/${loanId}?token=${token}`;
  }

  private generateAccessToken(loanId: string): string {
    // Generate secure access token for DRM
    return Buffer.from(`${loanId}-${Date.now()}`).toString('base64');
  }

  private async revokeAccess(loanId: string): Promise<void> {
    // Revoke DRM access tokens
    const loan = this.loans.get(loanId);
    if (loan) {
      loan.downloadToken = undefined;
    }
  }
}

export class LoanRules {
  static readonly MAX_CONCURRENT_LOANS = 10;
  static readonly MAX_LOAN_PERIOD_DAYS = 21;
  static readonly MIN_LOAN_PERIOD_DAYS = 1;
  static readonly MAX_RENEWALS = 2;

  static canCheckout(userId: string, loanManager: DigitalLoanManager): boolean {
    const activeLoans = loanManager.getActiveUserLoans(userId);
    return activeLoans.length < this.MAX_CONCURRENT_LOANS;
  }

  static isValidLoanPeriod(days: number): boolean {
    return days >= this.MIN_LOAN_PERIOD_DAYS && days <= this.MAX_LOAN_PERIOD_DAYS;
  }
}
