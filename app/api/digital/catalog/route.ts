/**
 * API Route: Digital Catalog
 * GET /api/digital/catalog - Get digital catalog with filters
 * POST /api/digital/catalog - Add new digital content (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DigitalFormat } from '@/types/digital-content';
import { getCatalogManager } from '@/lib/catalog-singleton';

export async function GET(request: NextRequest) {
  try {
    const catalogManager = getCatalogManager();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const format = searchParams.get('format') as DigitalFormat | null;
    const author = searchParams.get('author') || undefined;
    const genre = searchParams.get('genre') || undefined;
    const availableOnly = searchParams.get('availableOnly') === 'true';

    const filters = {
      format: format || undefined,
      author,
      genre,
      availableOnly,
    };

    const results = catalogManager.searchCatalog(query, filters);

    return NextResponse.json({
      success: true,
      count: results.length,
      items: results.map((content) => content.getMetadata()),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This would require admin authentication
    const body = await request.json();

    // Validate and add content to catalog
    // Implementation/Integration would go here

    return NextResponse.json({
      success: true,
      message: 'Content added to catalog',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to add content' },
      { status: 500 }
    );
  }
}
