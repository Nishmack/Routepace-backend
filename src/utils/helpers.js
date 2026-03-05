/**
 * Send a success response
 */
exports.sendSuccess = (res, statusCode, message, data = {}) => {
  res.status(statusCode).json({ success: true, message, data });
};

/**
 * Send a paginated response
 */
exports.sendPaginated = (res, data, pagination) => {
  res.status(200).json({ success: true, data, pagination });
};

/**
 * Build pagination metadata
 */
exports.getPagination = (page, limit, total) => {
  const currentPage = Number(page) || 1;
  const perPage = Number(limit) || 20;
  const totalPages = Math.ceil(total / perPage);

  return {
    total,
    page: currentPage,
    limit: perPage,
    pages: totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

/**
 * Parse date range from query params
 */
exports.getDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
  start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};
