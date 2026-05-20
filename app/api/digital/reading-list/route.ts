/**
 * API Route: Reading List
 * GET /api/digital/reading-list - Get user's reading list
 * POST /api/digital/reading-list - Add item to reading list
 * DELETE /api/digital/reading-list - Remove item from reading list
 *
 * Uses Firebase Firestore for persistent storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCatalogManager } from '@/lib/catalog-singleton';
import {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  WishlistItem
} from '@/lib/firebase-user-data';

const catalogManager = getCatalogManager();

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const withDetails = request.nextUrl.searchParams.get('withDetails') === 'true';
    const wishlistItems = await getUserWishlist(userId);

    // for content details implementation
    if (withDetails) {
      const items = wishlistItems.map((item) => {
        let contentDetails;
        if (item.isDigital) {
          const content = catalogManager.getContent(item.contentId);
          contentDetails = content?.getMetadata();
        }

        return {
          item: {
            itemId: item.id,
            userId,
            contentId: item.contentId,
            isDigital: item.isDigital,
            addedDate: item.addedDate?.toDate() || new Date(),
            notes: item.notes,
          },
          contentDetails: contentDetails || {
            title: item.title,
            author: item.author,
            coverImageUrl: item.coverImageUrl,
            formatType: item.formatType,
            availableCopies: 0,
            totalCopies: 0,
          },
        };
      });

      return NextResponse.json({
        success: true,
        count: items.length,
        items,
      });
    } else {
      const items = wishlistItems.map((item) => ({
        itemId: item.id,
        userId,
        contentId: item.contentId,
        isDigital: item.isDigital,
        addedDate: item.addedDate?.toDate() || new Date(),
        notes: item.notes,
      }));

      return NextResponse.json({
        success: true,
        count: items.length,
        items,
      });
    }
  } catch (error) {
    console.error('Failed to fetch reading list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reading list' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contentId, isDigital, notes, title, author, coverImageUrl, formatType } = body;

    if (!userId || !contentId || isDigital === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get content details from catalog if not provided
    let itemTitle = title;
    let itemAuthor = author;
    let itemCoverUrl = coverImageUrl;
    let itemFormat = formatType;

    if (isDigital && (!title || !author)) {
      const content = catalogManager.getContent(contentId);
      if (content) {
        const metadata = content.getMetadata();
        itemTitle = itemTitle || metadata.title;
        itemAuthor = itemAuthor || metadata.author;
        itemCoverUrl = itemCoverUrl || metadata.coverImageUrl;
        itemFormat = itemFormat || metadata.formatType;
      }
    }

    // Ensure all fields have no undefined values
    const sanitizedItem = {
      contentId,
      title: itemTitle || 'Unknown Title',
      author: itemAuthor || 'Unknown Author',
      coverImageUrl: itemCoverUrl || null, 
      formatType: itemFormat || 'UNKNOWN',
      isDigital,
      notes: notes || '',
    };

    const itemId = await addToWishlist(userId, sanitizedItem);

    return NextResponse.json({
      success: true,
      item: {
        itemId,
        userId,
        contentId,
        isDigital,
        addedDate: new Date(),
        notes: sanitizedItem.notes,
      },
    });
  } catch (error) {
    console.error('Failed to add to reading list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add to reading list: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itemId } = body;

    if (!userId || !itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await removeFromWishlist(userId, itemId);

    return NextResponse.json({
      success: true,
      message: 'Item removed from reading list',
    });
  } catch (error) {
    console.error('Failed to remove from reading list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove from reading list' },
      { status: 500 }
    );
  }
}
