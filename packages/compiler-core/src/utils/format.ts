import * as R from 'ramda';

export const INNER_ITEM_MATCH_REGEX: RegExp = /%{([?.\w]*)}/g; // match = 1

/**
 * Inserts into template string with %{} characters variables
 *
 * @example
 * "test ${}" => "test variableValue"
 */
export function format(str: string, params: object | Array<any>): string {
  let counter = 0;

  return str.replace(INNER_ITEM_MATCH_REGEX, (_, match) => {
    if (R.is(String, match) && match.length) {
      return params[match];
    }

    return params[counter++];
  });
}

/**
 * Formats date to string YYYY-MM-DD
 */
export function formatDate(
  date: Date,
  withDay: boolean = true,
  separator: string = '-',
): string {
  if (!date) {
    return null;
  }

  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = (date.getDate() + 1).toString().padStart(2, '0');

  let formatted = `${date.getFullYear()}${separator}${month}`;
  if (withDay) {
    formatted = `${formatted}${separator}${day}`;
  }

  return formatted;
}

/**
 * Formats date to time string HH:MM:SS
 */
export function formatTime(
  date: Date,
  withSeconds: boolean = true,
  separator: string = ':',
): string {
  if (!date) {
    return null;
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  let formatted = `${hours}${separator}${minutes}`;
  if (withSeconds) {
    const seconds = date.getSeconds().toString().padStart(2, '0');
    formatted = `${formatted}${separator}${seconds}`;
  }

  return formatted;
}
