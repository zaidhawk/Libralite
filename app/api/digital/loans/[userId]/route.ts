/**
 * API Route: User Loans
 * GET /api/digital/loans/[userId] - Get user's digital loans
 *
 * Uses Firebase Firestore for persistent storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCatalogManager } from '@/lib/catalog-singleton';
import { getUserLoans, getActiveUserLoans } from '@/lib/firebase-user-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const catalogManager = getCatalogManager();
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const activeOnly = request.nextUrl.searchParams.get('activeOnly') === 'true';

    const loans = activeOnly
      ? await getActiveUserLoans(userId)
      : await getUserLoans(userId);

    // Enrich with content details and time remaining
    const enrichedLoans = loans.map((loan) => {
      const content = catalogManager.getContent(loan.contentId);
      const expirationDate = loan.expirationDate?.toDate() || new Date();
      const now = new Date();
      const timeRemaining = Math.max(0, expirationDate.getTime() - now.getTime());

      return {
        loanId: loan.id,
        contentId: loan.contentId,
        userId,
        checkoutDate: loan.checkoutDate?.toDate() || new Date(),
        expirationDate,
        status: loan.status,
        contentDetails: content?.getMetadata() || {
          title: loan.title,
          author: loan.author,
          coverImageUrl: loan.coverImageUrl,
          formatType: loan.formatType,
        },
        timeRemainingMs: timeRemaining,
        daysRemaining: Math.ceil(timeRemaining / (1000 * 60 * 60 * 24)),
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedLoans.length,
      loans: enrichedLoans,
    });
  } catch (error) {
    console.error('Failed to fetch loans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}
