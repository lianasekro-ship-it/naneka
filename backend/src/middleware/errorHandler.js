/**
 * Global Express error handler.
 * Must be registered last with app.use().
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  // Unwrap Cloudinary SDK plain-object errors: { error: { message: '...' } }
  // and any other non-standard thrown values.
  let message;
  if (err instanceof Error) {
    message = err.message || 'Internal Server Error';
  } else if (err?.error?.message) {
    message = err.error.message;
  } else if (typeof err?.message === 'string') {
    message = err.message;
  } else if (typeof err === 'string') {
    message = err;
  } else {
    message = JSON.stringify(err) || 'Internal Server Error';
  }

  // Always log full detail — Vercel surfaces console.error in Functions log.
  console.error(`[error] ${status} ${req.method} ${req.path} — ${message}`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  } else {
    // Log the raw thrown value so we can see its exact shape
    console.error('[error] Raw thrown value:', err);
  }

  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: err instanceof Error ? err.stack : undefined,
        raw:   !(err instanceof Error) ? err : undefined,
      }),
    },
  });
}

/**
 * Creates a well-formed HTTP error to be passed to next().
 * @param {number} status   HTTP status code
 * @param {string} message  Human-readable message
 */
export function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
