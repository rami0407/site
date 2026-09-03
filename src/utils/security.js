/**
 * Anti-XSS and Input Sanitization Utility
 * Cleans user input to prevent Cross-Site Scripting (XSS), HTML Injection, and script execution.
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
    .replace(/onload=/gi, '')
    .replace(/onclick=/gi, '');
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
 * Strips executable scripts, inline event handlers, and unauthorized iframes
 * from rich text HTML before rendering via dangerouslySetInnerHTML.
 */
export const sanitizeHtml = (htmlString) => {
  if (typeof htmlString !== 'string') return '';
  return htmlString
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, (match) => {
      // Allow only verified safe video & map embeds
      if (/src=["'](https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com|google\.com\/maps))/i.test(match)) {
        return match;
      }
      return '';
    })
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '') // Removes onerror, onload, onclick, etc.
    .replace(/\son\w+\s*=\s*[^"'\s>]+/gi, '')
    .replace(/javascript:/gi, '');
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
