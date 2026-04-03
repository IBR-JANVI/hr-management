/**
 * @module ApiResponse
 * @description Helper module for standardizing API responses with consistent success/error structure
 */
class ApiResponse {
  static success(res, data, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      error: null
    });
  }

  static error(res, error, statusCode = 500) {
    const errorPayload = error instanceof Error
      ? { message: error.message, code: 'INTERNAL_ERROR' }
      : { message: error?.message || 'An error occurred', code: error?.code || 'ERROR' };

    return res.status(statusCode).json({
      success: false,
      data: null,
      error: errorPayload
    });
  }
}

module.exports = ApiResponse;
