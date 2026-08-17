export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
}

function getDatabaseErrorResponse(error) {
  if (error?.code === "P1001") {
    return {
      message: "Database is unreachable. Check your internet connection and Neon database status.",
      statusCode: 503
    };
  }

  if (error?.code === "P2028") {
    return {
      message: "Database transaction timed out. Try the action again.",
      statusCode: 503
    };
  }

  return null;
}

export function errorHandler(error, _req, res, _next) {
  const databaseError = getDatabaseErrorResponse(error);
  const statusCode = databaseError?.statusCode ||
    (Number.isInteger(error.statusCode) ? error.statusCode : 500);
  const message =
    databaseError?.message ||
    error.publicMessage ||
    (statusCode >= 500 ? "Internal server error." : error.message);

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    error: {
      message
    }
  });
}