import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export interface ValidationSchemas {
  body?: ZodType<any, any, any>;
  params?: ZodType<any, any, any>;
  query?: ZodType<any, any, any>;
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMsg = error.errors
          .map((err) => `${err.path.join('.') || 'field'}: ${err.message}`)
          .join('; ');
          
        return res.status(400).json({
          success: false,
          error: errorMsg,
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Internal server error during request validation.',
      });
    }
  };
}
