import { ZodError } from 'zod';

/**
 * Validates req.body (default) or another request part against a Zod schema.
 * Parsed result is always on req.parsed[source] (e.g. req.parsed.query).
 * For 'body', req.body is also updated (it remains writable in Express 5).
 * req.query is a read-only getter in Express 5, so never assigned directly.
 */
export default function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req.parsed ??= {};
      req.parsed[source] = parsed;
      if (source === 'body') {
        req.body = parsed;
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      return next(err);
    }
  };
}
