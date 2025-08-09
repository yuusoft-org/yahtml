/**
 * Convert YHTML array to HTML string
 *
 * @param {Array} yhtmlContent - The YHTML content as an array
 * @returns {string} The converted HTML string
 * @throws {TypeError} If yhtmlContent is not an array
 * @throws {Error} If element structure is malformed
 *
 * @example
 * // Simple element
 * convertToHtml(['h1: "Hello World"'])
 * // Returns: '<h1>Hello World</h1>'
 *
 * @example
 * // Nested structure with classes and IDs
 * convertToHtml([
 *   {
 *     'div#main.container': [
 *       'h1: "Title"',
 *       'p: "Content"'
 *     ]
 *   }
 * ])
 * // Returns: '<div id="main" class="container"><h1>Title</h1><p>Content</p></div>'
 *
 * @example
 * // Elements with attributes
 * convertToHtml([
 *   'img src="photo.jpg" alt="Photo":',
 *   'a href="https://example.com": "Link"'
 * ])
 * // Returns: '<img src="photo.jpg" alt="Photo"><a href="https://example.com">Link</a>'
 */
export function convertToHtml(yhtmlContent: any[]): string;
/**
 * List of HTML5 void elements (self-closing tags)
 * @constant {string[]}
 * @example
 * // Check if a tag is self-closing
 * if (SELF_CLOSING_TAGS.includes('br')) {
 *   // handle self-closing tag
 * }
 */
export const SELF_CLOSING_TAGS: string[];
