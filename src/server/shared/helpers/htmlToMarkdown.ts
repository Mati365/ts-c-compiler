import {Converter} from 'showdown';

/**
 * Transforms markdown to plain html
 *
 * @export
 * @param {string} html
 * @returns {string}
 */
export function htmlToMarkdown(html: string): string {
  return new Converter(
    {
      emoji: true,
      tasklists: true,
      tables: true,
      strikethrough: true,
      simplifiedAutoLink: true,
      parseImgDimensions: true,
      openLinksInNewWindow: true,
      headerLevelStart: 2,
    },
  ).makeHtml(html);
}
