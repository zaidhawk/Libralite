/**
 * API Route: Digital Return
 * POST /api/digital/return - Return digital content
 *
 * Uses Firebase Firestore for persistent storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { returnLoan } from '@/lib/firebase-user-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loanId, userId } = body;

    if (!loanId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process return in Firebase
    await returnLoan(userId, loanId);

    return NextResponse.json({
      success: true,
      message: 'Content returned successfully',
    });
  } catch (error) {
    console.error('Return failed:', error);
    return NextResponse.json(
      { success: false, error: 'Return failed' },
      { status: 500 }
    );
  }
}
