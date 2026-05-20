/**
 * Unit Tests for Digital Content & E-Book Lending Platform
 */

import {
  DigitalFormat,
  DRMType,
  LoanStatus,
  DigitalContentMetadata,
  DigitalLoan,
  ReadingListItem,
  CheckoutRequest,
  CheckoutResponse,
} from '../types/digital-content';

import {
  DigitalContent,
  EBook,
  AudioBook,
  DigitalCatalogManager,
} from '../lib/digital-catalog';

import { DigitalLoanManager, LoanRules } from '../lib/loan-management';

import { DRMController, AccessControlManager } from '../lib/drm-access-control';

import { ReadingList, ReadingListManager } from '../lib/reading-list';

//  Test Fixtures 

const createMockEBookMetadata = (overrides?: Partial<DigitalContentMetadata>): DigitalContentMetadata => ({
  contentId: 'ebook-001',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  formatType: DigitalFormat.EPUB,
  drmType: DRMType.ADOBE,
  fileSizeMB: 2.5,
  isbn: '978-0743273565',
  publisher: 'Scribner',
  totalCopies: 5,
  availableCopies: 3,
  pageCount: 180,
  genre: 'Fiction',
  language: 'en',
  ...overrides,
});

const createMockAudioBookMetadata = (overrides?: Partial<DigitalContentMetadata>): DigitalContentMetadata => ({
  contentId: 'audiobook-001',
  title: '1984',
  author: 'George Orwell',
  formatType: DigitalFormat.AUDIOBOOK,
  drmType: DRMType.OVERDRIVE,
  fileSizeMB: 350,
  isbn: '978-0451524935',
  publisher: 'Penguin',
  totalCopies: 3,
  availableCopies: 2,
  language: 'en',
  duration: 720,
  narrator: 'Simon Prebble',
  ...overrides,
});

//  DigitalContent Tests 

describe('DigitalContent', () => {
  let content: DigitalContent;

  beforeEach(() => {
    content = new DigitalContent(createMockEBookMetadata());
  });

  test('should return metadata correctly', () => {
    const metadata = content.getMetadata();
    expect(metadata.contentId).toBe('ebook-001');
    expect(metadata.title).toBe('The Great Gatsby');
    expect(metadata.author).toBe('F. Scott Fitzgerald');
  });

  test('should return content ID', () => {
    expect(content.getContentId()).toBe('ebook-001');
  });

  test('should return title', () => {
    expect(content.getTitle()).toBe('The Great Gatsby');
  });

  test('should return author', () => {
    expect(content.getAuthor()).toBe('F. Scott Fitzgerald');
  });

  test('should check availability correctly when copies available', () => {
    expect(content.isAvailable()).toBe(true);
  });

  test('should check availability correctly when no copies available', () => {
    const unavailableContent = new DigitalContent(
      createMockEBookMetadata({ availableCopies: 0 })
    );
    expect(unavailableContent.isAvailable()).toBe(false);
  });

  test('should decrement available copies', () => {
    content.decrementAvailableCopies();
    expect(content.getMetadata().availableCopies).toBe(2);
  });

  test('should not decrement below zero', () => {
    const noStock = new DigitalContent(createMockEBookMetadata({ availableCopies: 0 }));
    noStock.decrementAvailableCopies();
    expect(noStock.getMetadata().availableCopies).toBe(0);
  });

  test('should increment available copies', () => {
    content.incrementAvailableCopies();
    expect(content.getMetadata().availableCopies).toBe(4);
  });

  test('should not increment above total copies', () => {
    const fullStock = new DigitalContent(
      createMockEBookMetadata({ totalCopies: 5, availableCopies: 5 })
    );
    fullStock.incrementAvailableCopies();
    expect(fullStock.getMetadata().availableCopies).toBe(5);
  });
});

//  EBook Tests 

describe('EBook', () => {
  let ebook: EBook;

  beforeEach(() => {
    ebook = new EBook(createMockEBookMetadata());
  });

  test('should return page count', () => {
    expect(ebook.getPageCount()).toBe(180);
  });

  test('should return genre', () => {
    expect(ebook.getGenre()).toBe('Fiction');
  });

  test('should return undefined for missing page count', () => {
    const ebookNoPages = new EBook(createMockEBookMetadata({ pageCount: undefined }));
    expect(ebookNoPages.getPageCount()).toBeUndefined();
  });
});

//  AudioBook Tests 

describe('AudioBook', () => {
  let audiobook: AudioBook;

  beforeEach(() => {
    audiobook = new AudioBook(createMockAudioBookMetadata());
  });

  test('should set format type to AUDIOBOOK', () => {
    expect(audiobook.getMetadata().formatType).toBe(DigitalFormat.AUDIOBOOK);
  });

  test('should return duration', () => {
    expect(audiobook.getDuration()).toBe(720);
  });

  test('should return narrator', () => {
    expect(audiobook.getNarrator()).toBe('Simon Prebble');
  });
});

//  DigitalCatalogManager Tests 

describe('DigitalCatalogManager', () => {
  let catalogManager: DigitalCatalogManager;
  let ebook1: EBook;
  let ebook2: EBook;
  let audiobook: AudioBook;

  beforeEach(() => {
    catalogManager = new DigitalCatalogManager();
    ebook1 = new EBook(createMockEBookMetadata());
    ebook2 = new EBook(
      createMockEBookMetadata({
        contentId: 'ebook-002',
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        genre: 'Drama',
      })
    );
    audiobook = new AudioBook(createMockAudioBookMetadata());

    catalogManager.addContent(ebook1);
    catalogManager.addContent(ebook2);
    catalogManager.addContent(audiobook);
  });

  test('should add content to catalog', () => {
    expect(catalogManager.getContent('ebook-001')).toBe(ebook1);
  });

  test('should remove content from catalog', () => {
    expect(catalogManager.removeContent('ebook-001')).toBe(true);
    expect(catalogManager.getContent('ebook-001')).toBeUndefined();
  });

  test('should return false when removing non-existent content', () => {
    expect(catalogManager.removeContent('non-existent')).toBe(false);
  });

  test('should search catalog by title', () => {
    const results = catalogManager.searchCatalog('Gatsby');
    expect(results).toHaveLength(1);
    expect(results[0].getTitle()).toBe('The Great Gatsby');
  });

  test('should search catalog by author', () => {
    const results = catalogManager.searchCatalog('Harper');
    expect(results).toHaveLength(1);
    expect(results[0].getAuthor()).toBe('Harper Lee');
  });

  test('should return all content when search query is empty', () => {
    const results = catalogManager.searchCatalog('');
    expect(results).toHaveLength(3);
  });

  test('should get available content', () => {
    const available = catalogManager.getAvailableContent();
    expect(available).toHaveLength(3);
  });

  test('should get content by format', () => {
    const audiobooks = catalogManager.getByFormat(DigitalFormat.AUDIOBOOK);
    expect(audiobooks).toHaveLength(1);
    expect(audiobooks[0].getMetadata().formatType).toBe(DigitalFormat.AUDIOBOOK);
  });

  test('should get content by author', () => {
    const byAuthor = catalogManager.getByAuthor('George Orwell');
    expect(byAuthor).toHaveLength(1);
    expect(byAuthor[0].getTitle()).toBe('1984');
  });
});

//  DigitalLoanManager Tests 

describe('DigitalLoanManager', () => {
  let catalogManager: DigitalCatalogManager;
  let loanManager: DigitalLoanManager;
  let ebook: EBook;

  beforeEach(() => {
    catalogManager = new DigitalCatalogManager();
    ebook = new EBook(createMockEBookMetadata());
    catalogManager.addContent(ebook);
    loanManager = new DigitalLoanManager(catalogManager);
  });

  test('should checkout content successfully', async () => {
    const request: CheckoutRequest = {
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    const response = await loanManager.checkoutContent(request);

    expect(response.success).toBe(true);
    expect(response.loanId).toBeDefined();
    expect(response.expirationDate).toBeDefined();
  });

  test('should fail checkout for non-existent content', async () => {
    const request: CheckoutRequest = {
      contentId: 'non-existent',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    const response = await loanManager.checkoutContent(request);

    expect(response.success).toBe(false);
    expect(response.error).toBe('Content not found');
  });

  test('should fail checkout when content not available', async () => {
    const unavailableEbook = new EBook(
      createMockEBookMetadata({ contentId: 'ebook-unavailable', availableCopies: 0 })
    );
    catalogManager.addContent(unavailableEbook);

    const request: CheckoutRequest = {
      contentId: 'ebook-unavailable',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    const response = await loanManager.checkoutContent(request);

    expect(response.success).toBe(false);
    expect(response.error).toBe('Content not available');
  });

  test('should fail duplicate checkout by same user', async () => {
    const request: CheckoutRequest = {
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    await loanManager.checkoutContent(request);
    const secondResponse = await loanManager.checkoutContent(request);

    expect(secondResponse.success).toBe(false);
    expect(secondResponse.error).toBe('Content already checked out by user');
  });

  test('should decrement available copies after checkout', async () => {
    const request: CheckoutRequest = {
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    await loanManager.checkoutContent(request);

    expect(ebook.getMetadata().availableCopies).toBe(2);
  });

  test('should return content successfully', async () => {
    const request: CheckoutRequest = {
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    const checkoutResponse = await loanManager.checkoutContent(request);
    const returnResult = await loanManager.returnContent(checkoutResponse.loanId!);

    expect(returnResult).toBe(true);
  });

  test('should increment available copies after return', async () => {
    const request: CheckoutRequest = {
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    const checkoutResponse = await loanManager.checkoutContent(request);
    await loanManager.returnContent(checkoutResponse.loanId!);

    expect(ebook.getMetadata().availableCopies).toBe(3);
  });

  test('should fail to return non-existent loan', async () => {
    const returnResult = await loanManager.returnContent('non-existent');
    expect(returnResult).toBe(false);
  });

  test('should get user loans', async () => {
    const request: CheckoutRequest = {
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    await loanManager.checkoutContent(request);
    const userLoans = loanManager.getUserLoans('user-001');

    expect(userLoans).toHaveLength(1);
  });

  test('should get active user loans', async () => {
    const request: CheckoutRequest = {
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    const checkoutResponse = await loanManager.checkoutContent(request);
    await loanManager.returnContent(checkoutResponse.loanId!);

    const activeLoans = loanManager.getActiveUserLoans('user-001');
    expect(activeLoans).toHaveLength(0);
  });

  test('should check if user has active checkout', async () => {
    const request: CheckoutRequest = {
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    await loanManager.checkoutContent(request);

    expect(loanManager.hasActiveCheckout('user-001', 'ebook-001')).toBe(true);
    expect(loanManager.hasActiveCheckout('user-001', 'ebook-002')).toBe(false);
  });

  test('should get time remaining for loan', async () => {
    const request: CheckoutRequest = {
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    const response = await loanManager.checkoutContent(request);
    const timeRemaining = loanManager.getTimeRemaining(response.loanId!);

    expect(timeRemaining).toBeGreaterThan(0);
  });

  test('should renew loan successfully', async () => {
    const request: CheckoutRequest = {
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    };

    const response = await loanManager.checkoutContent(request);
    const loan = loanManager.getLoan(response.loanId!);
    const originalExpiration = loan!.expirationDate.getTime();

    const renewResult = await loanManager.renewLoan(response.loanId!, 7);

    expect(renewResult).toBe(true);
    const updatedLoan = loanManager.getLoan(response.loanId!);
    expect(updatedLoan!.expirationDate.getTime()).toBeGreaterThan(originalExpiration);
  });
});

//  LoanRules Tests 

describe('LoanRules', () => {
  let catalogManager: DigitalCatalogManager;
  let loanManager: DigitalLoanManager;

  beforeEach(() => {
    catalogManager = new DigitalCatalogManager();
    loanManager = new DigitalLoanManager(catalogManager);
  });

  test('should have correct max concurrent loans', () => {
    expect(LoanRules.MAX_CONCURRENT_LOANS).toBe(10);
  });

  test('should have correct max loan period', () => {
    expect(LoanRules.MAX_LOAN_PERIOD_DAYS).toBe(21);
  });

  test('should have correct min loan period', () => {
    expect(LoanRules.MIN_LOAN_PERIOD_DAYS).toBe(1);
  });

  test('should validate valid loan period', () => {
    expect(LoanRules.isValidLoanPeriod(14)).toBe(true);
    expect(LoanRules.isValidLoanPeriod(1)).toBe(true);
    expect(LoanRules.isValidLoanPeriod(21)).toBe(true);
  });

  test('should invalidate invalid loan period', () => {
    expect(LoanRules.isValidLoanPeriod(0)).toBe(false);
    expect(LoanRules.isValidLoanPeriod(22)).toBe(false);
    expect(LoanRules.isValidLoanPeriod(-1)).toBe(false);
  });

  test('should allow checkout when under limit', () => {
    expect(LoanRules.canCheckout('user-001', loanManager)).toBe(true);
  });
});

// DRMController Tests 

describe('DRMController', () => {
  let drmController: DRMController;

  beforeEach(() => {
    drmController = new DRMController();
  });

  test('should generate access token', () => {
    const token = drmController.generateAccessToken(
      'loan-001',
      'user-001',
      'content-001',
      24
    );

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  test('should validate valid token', () => {
    const token = drmController.generateAccessToken(
      'loan-001',
      'user-001',
      'content-001',
      24
    );

    expect(drmController.validateAccessToken(token)).toBe(true);
  });

  test('should invalidate non-existent token', () => {
    expect(drmController.validateAccessToken('non-existent-token')).toBe(false);
  });

  test('should revoke token', () => {
    const token = drmController.generateAccessToken(
      'loan-001',
      'user-001',
      'content-001',
      24
    );

    drmController.revokeToken(token);

    expect(drmController.validateAccessToken(token)).toBe(false);
  });

  test('should revoke all tokens for loan', () => {
    const token1 = drmController.generateAccessToken(
      'loan-001',
      'user-001',
      'content-001',
      24
    );
    const token2 = drmController.generateAccessToken(
      'loan-001',
      'user-001',
      'content-001',
      24
    );
    const token3 = drmController.generateAccessToken(
      'loan-002',
      'user-001',
      'content-002',
      24
    );

    drmController.revokeAllTokensForLoan('loan-001');

    expect(drmController.validateAccessToken(token1)).toBe(false);
    expect(drmController.validateAccessToken(token2)).toBe(false);
    expect(drmController.validateAccessToken(token3)).toBe(true);
  });

  test('should get token info', () => {
    const token = drmController.generateAccessToken(
      'loan-001',
      'user-001',
      'content-001',
      24
    );

    const tokenInfo = drmController.getTokenInfo(token);

    expect(tokenInfo).toBeDefined();
    expect(tokenInfo!.loanId).toBe('loan-001');
    expect(tokenInfo!.userId).toBe('user-001');
    expect(tokenInfo!.contentId).toBe('content-001');
  });
});

//  AccessControlManager Tests 

describe('AccessControlManager', () => {
  let catalogManager: DigitalCatalogManager;
  let loanManager: DigitalLoanManager;
  let drmController: DRMController;
  let accessControlManager: AccessControlManager;
  let ebook: EBook;

  beforeEach(async () => {
    catalogManager = new DigitalCatalogManager();
    ebook = new EBook(createMockEBookMetadata());
    catalogManager.addContent(ebook);
    loanManager = new DigitalLoanManager(catalogManager);
    drmController = new DRMController();
    accessControlManager = new AccessControlManager(drmController, loanManager);
  });

  test('should authorize download for valid loan', async () => {
    const checkoutResponse = await loanManager.checkoutContent({
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    });

    const authResult = await accessControlManager.authorizeDownload(
      checkoutResponse.loanId!,
      'user-001'
    );

    expect(authResult.authorized).toBe(true);
    expect(authResult.token).toBeDefined();
  });

  test('should deny download for non-existent loan', async () => {
    const authResult = await accessControlManager.authorizeDownload(
      'non-existent',
      'user-001'
    );

    expect(authResult.authorized).toBe(false);
    expect(authResult.error).toBe('Loan not found');
  });

  test('should deny download for unauthorized user', async () => {
    const checkoutResponse = await loanManager.checkoutContent({
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    });

    const authResult = await accessControlManager.authorizeDownload(
      checkoutResponse.loanId!,
      'user-002'
    );

    expect(authResult.authorized).toBe(false);
    expect(authResult.error).toBe('Unauthorized user');
  });

  test('should validate access with valid token', async () => {
    const checkoutResponse = await loanManager.checkoutContent({
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    });

    const authResult = await accessControlManager.authorizeDownload(
      checkoutResponse.loanId!,
      'user-001'
    );

    const isValid = await accessControlManager.validateAccess(
      authResult.token!,
      'ebook-001'
    );

    expect(isValid).toBe(true);
  });

  test('should invalidate access with wrong content ID', async () => {
    const checkoutResponse = await loanManager.checkoutContent({
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    });

    const authResult = await accessControlManager.authorizeDownload(
      checkoutResponse.loanId!,
      'user-001'
    );

    const isValid = await accessControlManager.validateAccess(
      authResult.token!,
      'wrong-content-id'
    );

    expect(isValid).toBe(false);
  });

  test('should revoke access for loan', async () => {
    const checkoutResponse = await loanManager.checkoutContent({
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    });

    const authResult = await accessControlManager.authorizeDownload(
      checkoutResponse.loanId!,
      'user-001'
    );

    await accessControlManager.revokeAccess(checkoutResponse.loanId!);

    const isValid = await accessControlManager.validateAccess(
      authResult.token!,
      'ebook-001'
    );

    expect(isValid).toBe(false);
  });
});

//  ReadingList Tests 

describe('ReadingList', () => {
  let readingList: ReadingList;

  beforeEach(() => {
    readingList = new ReadingList();
  });

  test('should add item to reading list', () => {
    const item = readingList.addItem('user-001', 'content-001', true, 'Great book!');

    expect(item.itemId).toBeDefined();
    expect(item.userId).toBe('user-001');
    expect(item.contentId).toBe('content-001');
    expect(item.isDigital).toBe(true);
    expect(item.notes).toBe('Great book!');
  });

  test('should remove item from reading list', () => {
    const item = readingList.addItem('user-001', 'content-001', true);
    const result = readingList.removeItem(item.itemId);

    expect(result).toBe(true);
    expect(readingList.getItem(item.itemId)).toBeUndefined();
  });

  test('should return false when removing non-existent item', () => {
    const result = readingList.removeItem('non-existent');
    expect(result).toBe(false);
  });

  test('should get item by ID', () => {
    const item = readingList.addItem('user-001', 'content-001', true);
    const retrieved = readingList.getItem(item.itemId);

    expect(retrieved).toEqual(item);
  });

  test('should get user items', () => {
    readingList.addItem('user-001', 'content-001', true);
    readingList.addItem('user-001', 'content-002', false);
    readingList.addItem('user-002', 'content-003', true);

    const userItems = readingList.getUserItems('user-001');

    expect(userItems).toHaveLength(2);
  });

  test('should get digital items only', () => {
    readingList.addItem('user-001', 'content-001', true);
    readingList.addItem('user-001', 'content-002', false);
    readingList.addItem('user-001', 'content-003', true);

    const digitalItems = readingList.getDigitalItems('user-001');

    expect(digitalItems).toHaveLength(2);
    expect(digitalItems.every((item) => item.isDigital)).toBe(true);
  });

  test('should get physical items only', () => {
    readingList.addItem('user-001', 'content-001', true);
    readingList.addItem('user-001', 'content-002', false);
    readingList.addItem('user-001', 'content-003', false);

    const physicalItems = readingList.getPhysicalItems('user-001');

    expect(physicalItems).toHaveLength(2);
    expect(physicalItems.every((item) => !item.isDigital)).toBe(true);
  });

  test('should update notes', () => {
    const item = readingList.addItem('user-001', 'content-001', true, 'Original note');
    const result = readingList.updateNotes(item.itemId, 'Updated note');

    expect(result).toBe(true);
    expect(readingList.getItem(item.itemId)!.notes).toBe('Updated note');
  });

  test('should return false when updating notes for non-existent item', () => {
    const result = readingList.updateNotes('non-existent', 'Note');
    expect(result).toBe(false);
  });

  test('should check if user has item', () => {
    readingList.addItem('user-001', 'content-001', true);

    expect(readingList.hasItem('user-001', 'content-001')).toBe(true);
    expect(readingList.hasItem('user-001', 'content-002')).toBe(false);
  });

  test('should clear user list', () => {
    readingList.addItem('user-001', 'content-001', true);
    readingList.addItem('user-001', 'content-002', true);
    readingList.addItem('user-002', 'content-003', true);

    readingList.clearUserList('user-001');

    expect(readingList.getUserItems('user-001')).toHaveLength(0);
    expect(readingList.getUserItems('user-002')).toHaveLength(1);
  });
});

//  ReadingListManager Tests 

describe('ReadingListManager', () => {
  let catalogManager: DigitalCatalogManager;
  let readingListManager: ReadingListManager;

  beforeEach(() => {
    catalogManager = new DigitalCatalogManager();
    catalogManager.addContent(new EBook(createMockEBookMetadata()));
    readingListManager = new ReadingListManager(catalogManager);
  });

  test('should get user reading list', () => {
    const list = readingListManager.getUserReadingList('user-001');
    expect(list).toBeInstanceOf(ReadingList);
  });

  test('should add to reading list', () => {
    const item = readingListManager.addToReadingList(
      'user-001',
      'ebook-001',
      true,
      'Want to read this'
    );

    expect(item.contentId).toBe('ebook-001');
    expect(item.notes).toBe('Want to read this');
  });

  test('should remove from reading list', () => {
    const item = readingListManager.addToReadingList('user-001', 'ebook-001', true);
    const result = readingListManager.removeFromReadingList('user-001', item.itemId);

    expect(result).toBe(true);
  });

  test('should sort by added date descending', async () => {
    readingListManager.addToReadingList('user-001', 'content-001', true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    readingListManager.addToReadingList('user-001', 'content-002', true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    readingListManager.addToReadingList('user-001', 'content-003', true);

    const sorted = readingListManager.sortByAddedDate('user-001', false);

    expect(sorted[0].contentId).toBe('content-003');
    expect(sorted[2].contentId).toBe('content-001');
  });

  test('should sort by added date ascending', async () => {
    readingListManager.addToReadingList('user-001', 'content-001', true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    readingListManager.addToReadingList('user-001', 'content-002', true);
    await new Promise((resolve) => setTimeout(resolve, 10));
    readingListManager.addToReadingList('user-001', 'content-003', true);

    const sorted = readingListManager.sortByAddedDate('user-001', true);

    expect(sorted[0].contentId).toBe('content-001');
    expect(sorted[2].contentId).toBe('content-003');
  });
});

//  Integration Tests 

describe('Integration: Full Checkout Flow', () => {
  let catalogManager: DigitalCatalogManager;
  let loanManager: DigitalLoanManager;
  let drmController: DRMController;
  let accessControlManager: AccessControlManager;
  let readingListManager: ReadingListManager;

  beforeEach(() => {
    catalogManager = new DigitalCatalogManager();
    catalogManager.addContent(new EBook(createMockEBookMetadata()));
    catalogManager.addContent(new AudioBook(createMockAudioBookMetadata()));
    loanManager = new DigitalLoanManager(catalogManager);
    drmController = new DRMController();
    accessControlManager = new AccessControlManager(drmController, loanManager);
    readingListManager = new ReadingListManager(catalogManager);
  });

  test('should complete full checkout and return flow', async () => {
    // 1. Add to reading list
    const readingListItem = readingListManager.addToReadingList(
      'user-001',
      'ebook-001',
      true
    );
    expect(readingListItem).toBeDefined();

    // 2. Check availability
    const content = catalogManager.getContent('ebook-001');
    expect(content!.isAvailable()).toBe(true);
    const initialCopies = content!.getMetadata().availableCopies;

    // 3. Checkout
    const checkoutResponse = await loanManager.checkoutContent({
      contentId: 'ebook-001',
      userId: 'user-001',
      loanPeriodDays: 14,
    });
    expect(checkoutResponse.success).toBe(true);
    expect(content!.getMetadata().availableCopies).toBe(initialCopies - 1);

    // 4. Get download authorization
    const authResult = await accessControlManager.authorizeDownload(
      checkoutResponse.loanId!,
      'user-001'
    );
    expect(authResult.authorized).toBe(true);

    // 5. Validate access
    const isValid = await accessControlManager.validateAccess(
      authResult.token!,
      'ebook-001'
    );
    expect(isValid).toBe(true);

    // 6. Return content
    const returnResult = await loanManager.returnContent(checkoutResponse.loanId!);
    expect(returnResult).toBe(true);
    expect(content!.getMetadata().availableCopies).toBe(initialCopies);

    // 7. Verify loan status
    const loan = loanManager.getLoan(checkoutResponse.loanId!);
    expect(loan!.status).toBe(LoanStatus.RETURNED);
  });

  test('should handle multiple users checking out same content', async () => {
    const content = catalogManager.getContent('ebook-001');
    const availableCopies = content!.getMetadata().availableCopies;

    // Checkout all available copies
    for (let i = 0; i < availableCopies; i++) {
      const response = await loanManager.checkoutContent({
        contentId: 'ebook-001',
        userId: `user-${i}`,
        loanPeriodDays: 14,
      });
      expect(response.success).toBe(true);
    }

    // Next user should fail - no copies left
    const failedResponse = await loanManager.checkoutContent({
      contentId: 'ebook-001',
      userId: 'user-999',
      loanPeriodDays: 14,
    });
    expect(failedResponse.success).toBe(false);
    expect(failedResponse.error).toBe('Content not available');
  });
});
