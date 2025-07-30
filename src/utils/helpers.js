const crypto = require('crypto');

/**
 * Generate a random string of specified length
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Create a slug from a string
 * @param {string} text - Text to convert to slug
 * @returns {string} Slug
 */
const createSlug = (text) => {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
};

/**
 * Sanitize HTML content (basic implementation)
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
const sanitizeHtml = (html) => {
  if (!html) return '';
  
  // Remove potentially dangerous tags and attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
};

/**
 * Extract text content from HTML
 * @param {string} html - HTML content
 * @returns {string} Plain text
 */
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add if truncated
 * @returns {string} Truncated text
 */
const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length).trim() + suffix;
};

/**
 * Calculate reading time for content
 * @param {string} content - Content to calculate reading time for
 * @param {number} wordsPerMinute - Words per minute reading speed
 * @returns {number} Reading time in minutes
 */
const calculateReadingTime = (content, wordsPerMinute = 200) => {
  if (!content) return 0;
  
  const plainText = stripHtml(content);
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generate pagination object
 * @param {number} currentPage - Current page number
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Items per page
 * @returns {object} Pagination object
 */
const generatePagination = (currentPage, totalItems, itemsPerPage) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null
  };
};

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Remove empty properties from object
 * @param {object} obj - Object to clean
 * @returns {object} Object without empty properties
 */
const removeEmptyProperties = (obj) => {
  const cleaned = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanedValue = removeEmptyProperties(value);
          if (Object.keys(cleanedValue).length > 0) {
            cleaned[key] = cleanedValue;
          }
        } else {
          cleaned[key] = value;
        }
      }
    }
  }
  
  return cleaned;
};

/**
 * Generate API response format
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {any} data - Response data
 * @param {any} errors - Response errors
 * @returns {object} Formatted API response
 */
const createApiResponse = (success, message, data = null, errors = null) => {
  const response = { success, message };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (errors !== null) {
    response.errors = errors;
  }
  
  return response;
};

/**
 * Escape special characters for regex
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

/**
 * Generate a unique filename
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  
  return `${timestamp}_${random}.${extension}`;
};

const getEnumValues =(model, field) => {
  const path = model.schema.path(field);
  return path?.enumValues || [];
}

const handleSortOrder = async (Model, sortOrder) => {
  let finalSortOrder;

  if (!sortOrder || isNaN(sortOrder)) {
    // Auto-increment max sortOrder
    const maxSort = await Model.findOne().sort('-sortOrder').select('sortOrder');
    finalSortOrder = maxSort ? maxSort.sortOrder + 1 : 1;
  } else {
    // Check if sortOrder already exists
    const exists = await Model.findOne({ sortOrder });
    if (exists) {
      throw new Error(`Sort order ${sortOrder} already exists for "${exists.name}". Please choose a different one.`);
    }
    finalSortOrder = sortOrder;
  }

  return finalSortOrder;
};

// Helper functions
const extractUsageFromFieldName = (fieldName) => {
  if (fieldName.includes('review')) return 'review';
  if (fieldName.includes('tech-news')) return 'tech-news';
  if (fieldName.includes('blog')) return 'blog';
  if (fieldName.includes('comparison')) return 'comparison';
  return 'others';
};

const extractMediaTypeFromFieldName = (fieldName) => {
  if (fieldName.includes('featured')) return 'featured';
  if (fieldName.includes('gallery')) return 'gallery';
  return 'inline';
};

const getMediaType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'other';
};

module.exports = {
  generateRandomString,
  createSlug,
  sanitizeHtml,
  stripHtml,
  truncateText,
  calculateReadingTime,
  formatFileSize,
  isValidEmail,
  isValidUrl,
  generatePagination,
  deepClone,
  removeEmptyProperties,
  createApiResponse,
  escapeRegex,
  toTitleCase,
  generateUniqueFilename,
  getEnumValues,
  handleSortOrder,
  extractUsageFromFieldName,
  extractMediaTypeFromFieldName,
  getMediaType
};
