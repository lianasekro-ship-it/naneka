/**
 * Global Express error handler.
 * Must be registered last with app.use().
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
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
