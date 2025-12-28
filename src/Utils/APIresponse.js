/**
 * Standard API Response format
 * Ensures consistent response structure across all endpoints
 */
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  // Factory methods for common responses
  static success(data, message = 'Success') {
    return new ApiResponse(200, data, message);
  }

  static created(data, message = 'Created successfully') {
    return new ApiResponse(201, data, message);
  }

  static noContent(message = 'No content') {
    return new ApiResponse(204, null, message);
  }
}

module.exports = ApiResponse;