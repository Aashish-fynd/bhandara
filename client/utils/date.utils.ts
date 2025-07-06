/** Convert a date into a long "January 1, 2024" style string. */
export const formatDateToLongString = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

/** Format a date with time, e.g. "January 1, 2024, 10:00 AM". */
export const formatDateWithTimeString = (date: string | Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true
  });
};

/**
 * Convert a past date into a relative time string such as "2 hours ago".
 */
export const formatTimeAgo = (date: string | Date): string => {
  if (!date) {
    return "";
  }

  const now = new Date();
  const pastDate = new Date(date);
  const seconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

  if (seconds < 5) {
    return "just now";
  }

  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  let counter;

  counter = Math.floor(seconds / intervals.year);
  if (counter > 0) {
    return counter === 1 ? "1 year ago" : `${counter} years ago`;
  }

  counter = Math.floor(seconds / intervals.month);
  if (counter > 0) {
    return counter === 1 ? "1 month ago" : `${counter} months ago`;
  }

  counter = Math.floor(seconds / intervals.day);
  if (counter > 0) {
    return counter === 1 ? "1 day ago" : `${counter} days ago`;
  }

  counter = Math.floor(seconds / intervals.hour);
  if (counter > 0) {
    return counter === 1 ? "1 hour ago" : `${counter} hours ago`;
  }

  counter = Math.floor(seconds / intervals.minute);
  if (counter > 0) {
    return counter === 1 ? "1 min ago" : `${counter} minutes ago`;
  }

  return `${seconds} seconds ago`;
};

export const formatDateRange = (startIso: Date, endIso?: Date) => {
  if (!startIso) return { full: "TBA", dateRange: "TBA", timeRange: "" };

  const start = new Date(startIso);
  const end = endIso ? new Date(endIso) : null;

  const dateOptions = { year: "numeric", month: "long", day: "numeric" };
  const timeOptions = { hour: "numeric", minute: "2-digit", hour12: true };

  const startDate = start.toLocaleDateString("en-US", dateOptions as any);
  const startTime = start.toLocaleTimeString("en-US", timeOptions as any);

  if (!end) {
    return {
      full: `${startDate} at ${startTime}`,
      dateRange: startDate,
      timeRange: startTime
    };
  }

  const endDate = end.toLocaleDateString("en-US", dateOptions as any);
  const endTime = end.toLocaleTimeString("en-US", timeOptions as any);

  return {
    full: `${startDate} at ${startTime} → ${endDate} at ${endTime}`,
    dateRange: `${startDate} - ${endDate}`,
    timeRange: `${startTime} - ${endTime}`
  };
};
