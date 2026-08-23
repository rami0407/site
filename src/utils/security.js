/**
 * Anti-XSS and Input Sanitization Utility
 * Cleans user input to prevent Cross-Site Scripting (XSS) and Script Injection attacks.
 */

export const sanitizeText = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/javascript:/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onload=/gi, '');
};

export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === 'string') {
        sanitized[key] = sanitizeText(val);
      } else if (typeof val === 'object' && val !== null) {
        sanitized[key] = sanitizeObject(val);
      } else {
        sanitized[key] = val;
      }
    }
  }
  return sanitized;
};

/**
 * Validates 9-Digit Israeli ID number algorithm (Luhn check variant)
 */
export const isValid9DigitId = (idStr) => {
  const clean = String(idStr).trim();
  if (!/^\d{9}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = Number(clean[i]) * ((i % 2) + 1);
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  return sum % 10 === 0;
};
