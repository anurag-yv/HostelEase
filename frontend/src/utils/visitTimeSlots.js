// Working hours: 09:00 - 18:00
export const WORK_HOURS = {
  startHour: 9,
  endHour: 18,
  label: '9:00 AM – 6:00 PM',
};

const SLOT_WINDOWS = [
  { start: 9, end: 11, label: '09:00 AM – 11:00 AM' },
  { start: 11, end: 13, label: '11:00 AM – 01:00 PM' },
  { start: 14, end: 16, label: '02:00 PM – 04:00 PM' },
  { start: 16, end: 18, label: '04:00 PM – 06:00 PM' },
];

/**
 * Returns dynamic future suggestions strictly within 9:00 AM to 6:00 PM.
 * Automatically eliminates slots that have already passed for today.
 */
export const getFutureVisitSuggestions = (baseDate = new Date()) => {
  const currentHour = baseDate.getHours();
  const currentMinute = baseDate.getMinutes();
  const suggestions = [];

  if (currentHour < 17) {
    SLOT_WINDOWS.forEach((slot) => {
      const isFutureSlot = slot.start > currentHour || (slot.start === currentHour && currentMinute < 45);
      if (isFutureSlot) {
        suggestions.push(`Today (${slot.label})`);
      }
    });

    if (currentHour >= 9 && currentHour <= 15) {
      const nextHour = currentHour + 1;
      const endWindow = Math.min(nextHour + 2, 18);
      const formatH = (h) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${displayH}:00 ${period}`;
      };
      const quickChip = `Today (${formatH(nextHour)} – ${formatH(endWindow)})`;
      if (!suggestions.includes(quickChip)) {
        suggestions.unshift(quickChip);
      }
    }
  }

  suggestions.push('Tomorrow (09:30 AM – 11:30 AM)');
  suggestions.push('Tomorrow (11:30 AM – 01:30 PM)');
  suggestions.push('Tomorrow (02:00 PM – 04:00 PM)');
  suggestions.push('Tomorrow (04:00 PM – 06:00 PM)');

  if (currentHour >= 16) {
    const dayAfter = new Date(baseDate);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayName = dayAfter.toLocaleDateString('en-US', { weekday: 'short' });
    suggestions.push(`${dayName} (10:00 AM – 12:00 PM)`);
    suggestions.push(`${dayName} (02:00 PM – 04:00 PM)`);
  }

  // Return top 5 distinct suggestions
  return Array.from(new Set(suggestions)).slice(0, 6);
};

/**
 * Validates whether an entered visit string violates working hours (9 AM - 6 PM)
 * or mentions forbidden past / after-hours times.
 */
export const validateVisitTime = (timeStr, baseDate = new Date()) => {
  if (!timeStr || !timeStr.trim()) {
    return { valid: false, error: 'Please specify a visit time.' };
  }

  const clean = timeStr.toLowerCase();

  // Check for prohibited night / evening hours outside 9 AM - 6 PM
  const outsideHoursPatterns = [
    /\b(7|8|9|10|11)\s*(:\d{2})?\s*pm\b/,
    /\b(12|1|2|3|4|5|6|7|8)\s*(:\d{2})?\s*am\b/,
    /after\s*(6|7|8|9)\s*pm/,
    /night/,
    /midnight/,
    /late\s*evening/,
    /early\s*morning/,
  ];

  for (const pattern of outsideHoursPatterns) {
    if (pattern.test(clean)) {
      return {
        valid: false,
        error: 'Hostel maintenance work hours are strictly from 9:00 AM to 6:00 PM only.',
      };
    }
  }

  // Check if "today" was selected when today's working hours are already over (after 5 PM)
  const currentHour = baseDate.getHours();
  if (clean.includes('today') && currentHour >= 17) {
    return {
      valid: false,
      error: 'Maintenance work hours for today have closed (9:00 AM - 6:00 PM). Please select Tomorrow or a future date.',
    };
  }

  return { valid: true };
};
