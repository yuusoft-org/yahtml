/**
 * Convert YAHTML array to HTML string
 *
 * @param {Array} yahtmlContent - The YAHTML content as an array
 * @returns {string} The converted HTML string
 * @throws {TypeError} If yahtmlContent is not an array
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
 *
 * @example
 * // Object notation with attributes and children
 * convertToHtml([
 *   { a: { href: '/', class: 'nav-link', children: ['Home'] }},
 *   { div: {
 *     class: 'container',
 *     children: [
 *       { h1: { id: 'title', children: ['Welcome'] }},
 *       { p: { children: ['Hello world'] }}
 *     ]
 *   }}
 * ])
 * // Returns: '<a href="/" class="nav-link">Home</a><div class="container"><h1 id="title">Welcome</h1><p>Hello world</p></div>'
 */
export function convertToHtml(yahtmlContent: any[]): string;
export { SELF_CLOSING_TAGS } from "./constants.js";
export { parseElementKey, parseYahtmlAst } from "./parser.js";
