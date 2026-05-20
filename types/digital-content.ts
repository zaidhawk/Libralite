/**
 * Digital Content & E-Book Lending Platform - Type Definitions
 */

export enum DigitalFormat {
  PDF = 'pdf',
  EPUB = 'epub',
  MOBI = 'mobi',
  AUDIOBOOK = 'audiobook',
}

export enum DRMType {
  ADOBE = 'adobe_drm',
  OVERDRIVE = 'overdrive',
  CUSTOM = 'custom_drm',
  NONE = 'none',
}

export enum LoanStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  RETURNED = 'returned',
}

export interface DigitalContentMetadata {
  contentId: string;
  title: string;
  author: string;
  formatType: DigitalFormat;
  drmType: DRMType;
  fileSizeMB: number;
  isbn?: string;
  publisher?: string;
  publicationDate?: Date;
  description?: string;
  coverImageUrl?: string;
  totalCopies: number;
  availableCopies: number;
  pageCount?: number;
  genre?: string;
  language: string;
  duration?: number; // for audiobooks
  narrator?: string; // for audiobooks
}

export interface DigitalLoan {
  loanId: string;
  contentId: string;
  userId: string;
  checkoutDate: Date;
  expirationDate: Date;
  status: LoanStatus;
  autoReturnScheduled: boolean;
  downloadToken?: string;
}

export interface ReadingListItem {
  itemId: string;
  userId: string;
  contentId: string;
  isDigital: boolean;
  addedDate: Date;
  notes?: string;
}

export interface ProviderConfig {
  providerName: string;
  apiKey: string;
  apiUrl: string;
  libraryId?: string;
}

export interface CheckoutRequest {
  contentId: string;
  userId: string;
  loanPeriodDays: number;
}

export interface CheckoutResponse {
  success: boolean;
  loanId?: string;
  expirationDate?: Date;
  downloadUrl?: string;
  error?: string;
}
