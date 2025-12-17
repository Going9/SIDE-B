/**
 * Date utility functions for Korean timezone (Asia/Seoul, UTC+9)
 */

/**
 * Convert UTC date string to Korean timezone and format
 * @param dateString ISO date string from Supabase (UTC)
 * @returns Formatted date string in Korean timezone (YYYY. MM. DD)
 */
export function formatDateKST(dateString: string): string {
  const date = new Date(dateString);
  
  // Convert to Korean timezone (Asia/Seoul, UTC+9)
  // Use Intl.DateTimeFormat for accurate timezone conversion
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  
  return `${year}. ${month}. ${day}`;
}

/**
 * Convert UTC date string to Korean timezone and format with full date
 * @param dateString ISO date string from Supabase (UTC)
 * @returns Formatted date string in Korean (e.g., "2024년 1월 1일")
 */
export function formatDateKSTFull(dateString: string): string {
  const date = new Date(dateString);
  
  // Convert to Korean timezone
  return date.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get current date/time in Korean timezone
 * @returns ISO string in Korean timezone
 */
export function getCurrentKST(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

/**
 * Convert date to Korean timezone ISO string
 * @param dateString ISO date string (UTC)
 * @returns ISO string in Korean timezone
 */
export function toKSTISOString(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", { timeZone: "Asia/Seoul" });
}

