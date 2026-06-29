import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/authenticate';

export async function getNote(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    const note = await prisma.note.upsert({
      where: { userId },
      update: {},
      create: {
        content: '',
        userId,
      },
    });

    return res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('getNote error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve notes.',
    });
  }
}

export async function upsertNote(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { content } = req.body;

    const note = await prisma.note.upsert({
      where: { userId },
      update: { content },
      create: {
        content,
        userId,
      },
    });

    return res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('upsertNote error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to save note content.',
    });
  }
}
