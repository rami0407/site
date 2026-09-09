/**
 * Calendar Export Utility for Musheirifa Elementary School
 * Supports: Google Calendar Direct URL & iCal (.ics) for Apple/Outlook/Samsung Calendar
 */

// Helper to format Date string YYYY-MM-DD to YYYYMMDD
const formatDateToCompact = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.replace(/[^0-9]/g, '').slice(0, 8);
};

// Helper to get next day in compact format YYYYMMDD (Google & iCal all-day events require DTEND to be the next day)
const getNextDayCompact = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return formatDateToCompact(dateStr);
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * Generate direct Google Calendar Event URL
 * @param {Object} event - { title, date, endDate, desc, description, category }
 * @returns {string} Google Calendar URL
 */
export const getGoogleCalendarUrl = (event) => {
  if (!event || !event.date) return '#';

  const title = event.title || 'فعالية في مدرسة مشيرفة الابتدائية';
  const desc = event.description || event.desc || 'متابعة عبر بوابة مدرسة مشيرفة الابتدائية الرسمية: https://musherfe.com';
  const location = 'مدرسة مشيرفة الابتدائية';

  const startDateCompact = formatDateToCompact(event.date);
  const endDateCompact = event.endDate 
    ? getNextDayCompact(event.endDate) 
    : getNextDayCompact(event.date);

  const datesParam = `${startDateCompact}/${endDateCompact}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: desc,
    location: location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate RFC 5545 iCalendar (.ics) string for single or multiple events
 * @param {Array|Object} events - Single event object or array of event objects
 * @returns {string} iCalendar formatted text
 */
export const generateIcsContent = (events) => {
  const eventsList = Array.isArray(events) ? events : [events];
  const nowCompact = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Musheirifa School//School Calendar AR//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:رزنامة مدرسة مشيرفة الابتدائية',
    'X-WR-TIMEZONE:Asia/Jerusalem'
  ];

  eventsList.forEach((evt, idx) => {
    if (!evt || !evt.date) return;

    const startCompact = formatDateToCompact(evt.date);
    const endCompact = evt.endDate 
      ? getNextDayCompact(evt.endDate) 
      : getNextDayCompact(evt.date);

    const title = (evt.title || 'فعالية مدرسية').replace(/[\r\n]+/g, ' ');
    const desc = (evt.description || evt.desc || '').replace(/[\r\n]+/g, '\\n');
    const uid = `musheirifa-${evt.id || idx}-${startCompact}@musherfe.com`;

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${uid}`);
    ics.push(`DTSTAMP:${nowCompact}`);
    ics.push(`DTSTART;VALUE=DATE:${startCompact}`);
    ics.push(`DTEND;VALUE=DATE:${endCompact}`);
    ics.push(`SUMMARY:${title}`);
    if (desc) ics.push(`DESCRIPTION:${desc}`);
    ics.push('LOCATION:مدرسة مشيرفة الابتدائية');
    ics.push('STATUS:CONFIRMED');
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
};

/**
 * Trigger immediate browser download of an .ics file
 * @param {Array|Object} events - Event or array of events
 * @param {string} filename - Desired filename
 */
export const downloadIcsCalendar = (events, filename = 'musheirifa_school_calendar.ics') => {
  try {
    const icsContent = generateIcsContent(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error downloading iCal calendar:', err);
  }
};
