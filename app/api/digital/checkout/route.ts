/**
 * API Route: Digital Checkout
 * POST /api/digital/checkout - Checkout digital content
 *
 * Uses Firebase Firestore for persistent storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoanRules } from '@/lib/loan-management';
import { getCatalogManager } from '@/lib/catalog-singleton';
import { CheckoutRequest } from '@/types/digital-content';
import { addLoan, getActiveUserLoans, hasActiveLoan } from '@/lib/firebase-user-data';
import { Timestamp } from 'firebase/firestore';

const MAX_CONCURRENT_LOANS = 10;

export async function POST(request: NextRequest) {
  try {
    const catalogManager = getCatalogManager();
    const body: CheckoutRequest = await request.json();
    const { contentId, userId, loanPeriodDays } = body;

    // Validate request
    if (!contentId || !userId || !loanPeriodDays) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check loan period validity
    if (!LoanRules.isValidLoanPeriod(loanPeriodDays)) {
      return NextResponse.json(
        {
          success: false,
          error: `Loan period must be between ${LoanRules.MIN_LOAN_PERIOD_DAYS} and ${LoanRules.MAX_LOAN_PERIOD_DAYS} days`,
        },
        { status: 400 }
      );
    }

    // Check concurrent loan limit
    const activeLoans = await getActiveUserLoans(userId);
    if (activeLoans.length >= MAX_CONCURRENT_LOANS) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum concurrent loans (${MAX_CONCURRENT_LOANS}) reached`,
        },
        { status: 400 }
      );
    }

    // Check if user already has this content checked out
    const alreadyBorrowed = await hasActiveLoan(userId, contentId);
    if (alreadyBorrowed) {
      return NextResponse.json(
        { success: false, error: 'Content already checked out by user' },
        { status: 400 }
      );
    }

    // Get content details
    const content = catalogManager.getContent(contentId);
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }
    if (!content.isAvailable()) {
      return NextResponse.json(
        { success: false, error: 'Content not available' },
        { status: 400 }
      );
    }

    const metadata = content.getMetadata();
    const checkoutDate = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(checkoutDate.getDate() + loanPeriodDays);

    // Save loan to Firebase
    const loanId = await addLoan(userId, {
      contentId,
      title: metadata.title,
      author: metadata.author,
      coverImageUrl: metadata.coverImageUrl,
      formatType: metadata.formatType,
      checkoutDate: Timestamp.fromDate(checkoutDate),
      expirationDate: Timestamp.fromDate(expirationDate),
      status: 'active',
    });

    // Decrement available copies in catalog
    content.decrementAvailableCopies();

    // Generate download URL
    const token = Buffer.from(`${loanId}-${Date.now()}`).toString('base64');
    const downloadUrl = `/api/digital/download/${loanId}?token=${token}`;

    return NextResponse.json({
      success: true,
      loanId,
      expirationDate,
      downloadUrl,
      persistToStorage: true,
    });
  } catch (error) {
    console.error('Checkout failed:', error);
    return NextResponse.json(
      { success: false, error: 'Checkout failed' },
      { status: 500 }
    );
  }
}
