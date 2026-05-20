/**
 * API Route: Digital Download
 * GET /api/digital/download/[loanId] - Download digital content
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLoanManager } from '@/lib/loan-singleton';
import { getCatalogManager } from '@/lib/catalog-singleton';
import { DRMController, AccessControlManager } from '@/lib/drm-access-control';

export async function GET(
  request: NextRequest,
  { params }: { params: { loanId: string } }
) {
  try {
    const loanManager = getLoanManager();
    const catalogManager = getCatalogManager();
    const drmController = new DRMController();
    const accessControlManager = new AccessControlManager(drmController, loanManager);

    const { loanId } = params;
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 401 }
      );
    }

    const loan = loanManager.getLoan(loanId);
    if (!loan) {
      return NextResponse.json(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      );
    }

    // Validate access
    const hasAccess = await accessControlManager.validateAccess(
      token,
      loan.contentId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 403 }
      );
    }

    // Get content
    const content = catalogManager.getContent(loan.contentId);
    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      );
    }

    // may not be in use because of integration

    const metadata = content.getMetadata();

    return NextResponse.json({
      success: true,
      message: 'Download authorized',
      contentId: loan.contentId,
      title: metadata.title,
      format: metadata.formatType,
      drmType: metadata.drmType,
      // In working implementation, return download URL or stream
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Download failed' },
      { status: 500 }
    );
  }
}
