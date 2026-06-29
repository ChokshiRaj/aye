import { Response } from 'express';
import { prisma } from '../utils/db';
import { AuthenticatedRequest } from '../middleware/authenticate';

// Get All Events for the Authenticated User
export async function getEvents(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    const formattedEvents = events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString().split('T')[0],
      startTime: e.startTime,
      endTime: e.endTime,
      category: e.category,
      description: e.description,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data: formattedEvents,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch events.',
    });
  }
}

// Create Calendar Event
export async function createEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { title, date, startTime, endTime, category, description } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        startTime,
        endTime,
        category,
        description: description || null,
        userId,
      },
    });

    const formattedEvent = {
      ...event,
      date: event.date.toISOString().split('T')[0],
    };

    return res.status(201).json({
      success: true,
      data: formattedEvent,
    });
  } catch (error: any) {
    return res.status(550).json({
      success: false,
      error: error.message || 'Failed to create event.',
    });
  }
}

// Update Calendar Event
export async function updateEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { title, date, startTime, endTime, category, description } = req.body;

    // Check ownership
    const existing = await prisma.event.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Event not found.',
      });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not own this event.',
      });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        date: date !== undefined ? new Date(date) : undefined,
        startTime: startTime !== undefined ? startTime : undefined,
        endTime: endTime !== undefined ? endTime : undefined,
        category: category !== undefined ? category : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    const formattedEvent = {
      ...updated,
      date: updated.date.toISOString().split('T')[0],
    };

    return res.status(200).json({
      success: true,
      data: formattedEvent,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update event.',
    });
  }
}

// Delete Calendar Event
export async function deleteEvent(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.event.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Event not found.',
      });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not own this event.',
      });
    }

    await prisma.event.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      data: { message: 'Event successfully removed.' },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete event.',
    });
  }
}
