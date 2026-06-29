import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/authenticate';

export async function getBookmarks(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: bookmarks,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('getBookmarks error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve bookmarks.',
    });
  }
}

export async function createBookmark(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { name, url, icon } = req.body;

    const bookmark = await prisma.bookmark.create({
      data: {
        name,
        url,
        icon: icon || null,
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      data: bookmark,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('createBookmark error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to create bookmark.',
    });
  }
}

export async function deleteBookmark(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify ownership
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!bookmark || bookmark.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Bookmark not found or access denied.',
      });
    }

    await prisma.bookmark.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Bookmark removed successfully.',
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('deleteBookmark error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to delete bookmark.',
    });
  }
}

export async function updateBookmark(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name, url, icon } = req.body;

    // Verify ownership
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!bookmark || bookmark.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Bookmark not found or access denied.',
      });
    }

    const updated = await prisma.bookmark.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        url: url !== undefined ? url : undefined,
        icon: icon !== undefined ? icon : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('updateBookmark error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to update bookmark.',
    });
  }
}
