import { Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { AuthenticatedRequest } from '../middleware/authenticate';

export async function getTodos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    const todos = await prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: todos,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('getTodos error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch todos.',
    });
  }
}

export async function createTodo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { text } = req.body;

    const todo = await prisma.todo.create({
      data: {
        text,
        userId,
      },
    });

    return res.status(201).json({
      success: true,
      data: todo,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('createTodo error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to create todo.',
    });
  }
}

export async function updateTodo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { text, done } = req.body;

    // Verify ownership
    const existingTodo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!existingTodo || existingTodo.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found or access denied.',
      });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: {
        ...(text !== undefined && { text }),
        ...(done !== undefined && { done }),
      },
    });

    // Create notification if marked done
    if (done === true && !existingTodo.done) {
      try {
        await prisma.notification.create({
          data: {
            title: 'Task complete',
            body: `You completed: ${updatedTodo.text}`,
            type: 'TODO',
            userId,
          },
        });
      } catch (notiErr) {
        console.error('Failed to auto-create todo notification:', notiErr);
      }
    }

    return res.status(200).json({
      success: true,
      data: updatedTodo,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('updateTodo error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to update todo.',
    });
  }
}

export async function deleteTodo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify ownership
    const existingTodo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!existingTodo || existingTodo.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found or access denied.',
      });
    }

    await prisma.todo.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Todo deleted successfully.',
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('deleteTodo error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to delete todo.',
    });
  }
}
