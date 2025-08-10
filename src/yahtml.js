/**
 * List of HTML5 void elements (self-closing tags)
 * @constant {string[]}
 * @example
 * // Check if a tag is self-closing
 * if (SELF_CLOSING_TAGS.includes('br')) {
 *   // handle self-closing tag
 * }
 */
export const SELF_CLOSING_TAGS = ['br', 'hr', 'img', 'input', 'meta', 'area', 'base', 'col', 'embed', 'link', 'param', 'source', 'track', 'wbr'];

/**
 * Convert YAHTML array to HTML string
 * 
 * @param {Array} yhtmlContent - The YAHTML content as an array
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
export function convertToHtml(yhtmlContent) {
  if (!Array.isArray(yhtmlContent)) {
    throw new TypeError('YAHTML content must be an array. YAHTML documents always start with an array at the root level.');
  }

  return yhtmlContent.map(element => processElement(element)).join('');
}

/**
 * Process a single YAHTML element
 * 
 * @private
 * @param {*} element - A YAHTML element (can be string, object, array, number, boolean, null, or undefined)
 * @returns {string} The HTML string for this element
 * 
 * @description
 * Handles various element types:
 * - null/undefined: returns empty string
 * - string: parses as element declaration or plain text
 * - number/boolean: converts to escaped text
 * - object: processes as element with attributes and content
 *   - Standard notation: { tag: content } or { tag: [children] }
 *   - Object notation: { tag: { attr: value, children: [...] }}
 * - array: recursively processes nested arrays
 */
function processElement(element) {
  // Handle null or undefined
  if (element === null || element === undefined) {
    return '';
  }

  // Handle strings that might be element declarations
  if (typeof element === 'string') {
    // Check if this is an element declaration
    // Pattern is: element_declaration: "content" or element_declaration: content
    // We need to find the colon that separates the element from content
    // The element part can contain attributes with = but not : followed by space and quote
    
    // First check if string ends with ':' (self-closing/empty element)
    if (element.endsWith(':')) {
      const key = element.slice(0, -1).trim();
      const elementObj = {};
      elementObj[key] = null;
      return processElement(elementObj);
    }
    
    // Look for ': "' or ": '" pattern which indicates the start of content
    let colonIndex = -1;
    const doubleQuotePattern = ': "';
    const singleQuotePattern = ": '";
    
    const dqIndex = element.indexOf(doubleQuotePattern);
    const sqIndex = element.indexOf(singleQuotePattern);
    
    if (dqIndex >= 0 && (sqIndex < 0 || dqIndex < sqIndex)) {
      colonIndex = dqIndex;
    } else if (sqIndex >= 0) {
      colonIndex = sqIndex;
    } else {
      // No quoted content, look for simple ': ' pattern
      // But only if it's not inside a URL or similar
      const simpleMatch = element.match(/^([^:]+?):\s+(.*)$/);
      if (simpleMatch && !simpleMatch[1].includes('//')) {
        const elementObj = {};
        elementObj[simpleMatch[1]] = simpleMatch[2];
        return processElement(elementObj);
      }
    }
    
    if (colonIndex >= 0) {
      const key = element.substring(0, colonIndex);
      const contentStr = element.substring(colonIndex + 2); // Skip ': '
      
      // Remove quotes if present
      let content = contentStr;
      if ((contentStr.startsWith('"') && contentStr.endsWith('"')) ||
          (contentStr.startsWith("'") && contentStr.endsWith("'"))) {
        content = contentStr.slice(1, -1);
        // Unescape internal quotes
        content = content.replace(/\\"/g, '"').replace(/\\'/g, "'");
      }

      const elementObj = {};
      elementObj[key] = content === '""' || content === "''" ? '' : content;
      return processElement(elementObj);
    }
    
    // Plain text content
    return escapeHtml(element);
  }

  // Handle numbers/booleans as text content
  if (typeof element === 'number' || typeof element === 'boolean') {
    return escapeHtml(String(element));
  }
  
  // Handle undefined - return empty string
  if (typeof element === 'undefined') {
    return '';
  }

  // Handle objects (element declarations)
  if (typeof element === 'object' && !Array.isArray(element)) {
    // Check if this is a Date or other built-in object type that shouldn't be used as content
    if (element instanceof Date) {
      throw new TypeError('Date objects cannot be used as content. Convert to string first (e.g., date.toISOString() or date.toLocaleDateString())');
    }
    
    const key = Object.keys(element)[0];
    
    // Handle undefined or empty key
    if (!key) {
      throw new Error('Malformed YAHTML element: empty element key');
    }
    
    const value = element[key];
    
    // Check if value is a Date object
    if (value instanceof Date) {
      throw new TypeError('Date objects cannot be used as element content. Convert to string first (e.g., date.toISOString() or date.toLocaleDateString())');
    }

    // Parse the element key for tag, id, classes, and attributes
    const { tag, id, classes, attributes } = parseElementKey(key);

    // Handle special case for DOCTYPE
    if (key.startsWith('"!DOCTYPE') || key.startsWith('!DOCTYPE')) {
      return '<!DOCTYPE html>';
    }

    // Check for malformed elements (no tag name)
    if (!tag) {
      throw new Error(`Malformed YAHTML element: "${key}" - element must have a valid tag name`);
    }

    // Build opening tag
    let html = `<${tag}`;

    // Add id if present
    if (id) {
      html += ` id="${id}"`;
    }

    // Add classes if present
    if (classes.length > 0 || attributes.some(attr => attr.name === 'class')) {
      // Check if there's also a class attribute
      const classAttr = attributes.find(attr => attr.name === 'class');
      if (classAttr) {
        // Merge shorthand classes with attribute classes
        const attrClasses = classAttr.value.split(' ').filter(c => c);
        const allClasses = [...classes, ...attrClasses];
        if (allClasses.length > 0) {
          html += ` class="${allClasses.join(' ')}"`;
        }
        // Remove the class attribute from attributes array since we've handled it
        attributes.splice(attributes.indexOf(classAttr), 1);
      } else if (classes.length > 0) {
        html += ` class="${classes.join(' ')}"`;
      }
    }

    // Add other attributes
    for (const attr of attributes) {
      if (attr.name === 'id') {
        // id attribute overrides shorthand
        html = html.replace(/ id="[^"]*"/, '');
        html += ` id="${attr.value}"`;
      } else if (attr.name === 'class') {
        // Already handled above
        continue;
      } else if (attr.value === true) {
        // Boolean attribute
        html += ` ${attr.name}`;
      } else if (attr.value === '') {
        // Empty string attribute
        html += ` ${attr.name}=""`;
      } else {
        // Regular attribute
        html += ` ${attr.name}="${escapeAttribute(attr.value)}"`;
      }
    }

    // Handle object notation attributes before closing tag
    if (typeof value === 'object' && value !== null && 'children' in value) {
      // Extract attributes from the object (excluding 'children')
      for (const [attrName, attrValue] of Object.entries(value)) {
        if (attrName === 'children') continue;
        
        // Check if this attribute was already added from the key
        const existingAttr = html.match(new RegExp(` ${attrName}="[^"]*"`));
        if (!existingAttr) {
          if (attrValue === true) {
            // Boolean attribute
            html += ` ${attrName}`;
          } else if (attrValue === '') {
            // Empty string attribute
            html += ` ${attrName}=""`;
          } else {
            // Regular attribute
            html += ` ${attrName}="${escapeAttribute(String(attrValue))}"`;
          }
        }
      }
    }

    // Check if it's a self-closing tag
    if (SELF_CLOSING_TAGS.includes(tag)) {
      html += '>';
      return html;
    }

    html += '>';

    // Process children or content
    if (Array.isArray(value)) {
      // Has children - flatten any nested arrays
      const flattenChildren = (arr) => {
        return arr.map(child => {
          if (Array.isArray(child)) {
            // Recursively flatten nested arrays
            return flattenChildren(child);
          }
          return processElement(child);
        }).join('');
      };
      html += flattenChildren(value);
    } else if (typeof value === 'object' && value !== null && 'children' in value) {
      // Object notation with children - attributes already handled above
      // Process children
      const children = value.children;
      if (Array.isArray(children)) {
        const flattenChildren = (arr) => {
          return arr.map(child => {
            if (Array.isArray(child)) {
              return flattenChildren(child);
            }
            return processElement(child);
          }).join('');
        };
        html += flattenChildren(children);
      } else if (children !== null && children !== undefined && children !== '') {
        // Single child value
        if (children instanceof Date) {
          throw new TypeError('Date objects cannot be used as element content. Convert to string first (e.g., date.toISOString() or date.toLocaleDateString())');
        }
        const rawContentTags = ['script', 'style'];
        if (rawContentTags.includes(tag)) {
          html += String(children);
        } else {
          html += escapeHtml(String(children));
        }
      }
    } else if (value !== null && value !== undefined && value !== '') {
      // Has text content
      // Some elements like script and style should not escape their content
      const rawContentTags = ['script', 'style'];
      if (rawContentTags.includes(tag)) {
        html += String(value);
      } else {
        html += escapeHtml(String(value));
      }
    } else if (value === undefined) {
      // Don't output 'undefined' as text
      // Just leave element empty
    }

    // Add closing tag
    html += `</${tag}>`;

    return html;
  }

  return '';
}

/**
 * Parse element key to extract tag, id, classes, and attributes
 * 
 * @private
 * @param {string} key - The element key string (e.g., "div#id.class1.class2 attr=value")
 * @returns {{tag: string, id: string, classes: string[], attributes: Array<{name: string, value: string|boolean}>}} Parsed components
 * 
 * @description
 * Parses YAHTML element declarations:
 * - Tag name: alphanumeric characters and hyphens
 * - ID: preceded by # (e.g., #my-id)
 * - Classes: preceded by . (e.g., .class1.class2)
 * - Attributes: key=value pairs (quoted or unquoted)
 * 
 * @example
 * parseElementKey('div#main.container.active class="extra" data-id=123')
 * // Returns: {
 * //   tag: 'div',
 * //   id: 'main',
 * //   classes: ['container', 'active'],
 * //   attributes: [
 * //     { name: 'class', value: 'extra' },
 * //     { name: 'data-id', value: '123' }
 * //   ]
 * // }
 */
function parseElementKey(key) {
  let tag = '';
  let id = '';
  let classes = [];
  let attributes = [];

  // Remove the trailing colon if present
  key = key.replace(/:$/, '');

  // Find where attributes start (first space after tag#id.class)
  const tagPart = key.match(/^[^\s]+/);
  if (!tagPart) {
    // No non-whitespace content at all
    return { tag: '', id: '', classes: [], attributes: [] };
  }
  
  let remainingKey = tagPart[0];
  let attrString = key.substring(tagPart[0].length).trim();

  // Parse attributes from the attribute string
  if (attrString) {
    // Parse attributes with better handling of quoted values
    let pos = 0;
    while (pos < attrString.length) {
      // Skip whitespace
      while (pos < attrString.length && /\s/.test(attrString[pos])) pos++;
      if (pos >= attrString.length) break;

      // Get attribute name
      let nameStart = pos;
      while (pos < attrString.length && /[a-zA-Z-]/.test(attrString[pos])) pos++;
      let attrName = attrString.substring(nameStart, pos);
      if (!attrName) break;

      // Check for = sign
      if (attrString[pos] === '=') {
        pos++; // skip =
        let attrValue = '';
        
        if (attrString[pos] === '"') {
          // Quoted value with double quotes
          pos++; // skip opening quote
          let valueStart = pos;
          while (pos < attrString.length && attrString[pos] !== '"') pos++;
          attrValue = attrString.substring(valueStart, pos);
          if (attrString[pos] === '"') pos++; // skip closing quote
        } else if (attrString[pos] === "'") {
          // Quoted value with single quotes
          pos++; // skip opening quote
          let valueStart = pos;
          while (pos < attrString.length && attrString[pos] !== "'") pos++;
          attrValue = attrString.substring(valueStart, pos);
          if (attrString[pos] === "'") pos++; // skip closing quote
        } else {
          // Unquoted value - read until whitespace or colon at end
          let valueStart = pos;
          while (pos < attrString.length && !/\s/.test(attrString[pos])) {
            // Stop at colon only if it's at the end (element declaration)
            if (attrString[pos] === ':' && pos === attrString.length - 1) break;
            pos++;
          }
          attrValue = attrString.substring(valueStart, pos);
        }
        
        attributes.push({ name: attrName, value: attrValue });
      } else {
        // Boolean attribute
        attributes.push({ name: attrName, value: true });
      }
    }
  }

  // Now parse the tag#id.class part
  // Check if this looks like an attribute (contains =) before any # or .
  if (remainingKey.includes('=') && !remainingKey.match(/^[a-zA-Z0-9-]+[#.]/)) {
    // This starts with an attribute, not a tag - invalid
    tag = '';
  } else {
    const tagMatch = remainingKey.match(/^([a-zA-Z0-9-]+)/);
    if (tagMatch) {
      tag = tagMatch[1];
      remainingKey = remainingKey.substring(tag.length);
    }
  }

  // Extract ID
  const idMatch = remainingKey.match(/#([a-zA-Z0-9-]+)/);
  if (idMatch) {
    id = idMatch[1];
  }

  // Extract classes
  const classRegex = /\.([a-zA-Z0-9-]+)/g;
  let classMatch;
  while ((classMatch = classRegex.exec(remainingKey)) !== null) {
    classes.push(classMatch[1]);
  }

  return { tag, id, classes, attributes };
}

/**
 * Escape HTML special characters in text content
 * 
 * @private
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML content
 * 
 * @description
 * Escapes the following characters:
 * - & becomes &amp;
 * - < becomes &lt;
 * - > becomes &gt;
 * - " becomes &quot;
 * - ' becomes &#39;
 * 
 * @example
 * escapeHtml('This & that < "quotes"')
 * // Returns: 'This &amp; that &lt; &quot;quotes&quot;'
 */
function escapeHtml(text) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  
  return text.replace(/[&<>"']/g, char => escapeMap[char]);
}

/**
 * Escape HTML special characters in attribute values
 * 
 * @private
 * @param {string} text - Text to escape
 * @returns {string} Escaped text safe for HTML attributes
 * 
 * @description
 * Escapes characters for use in HTML attribute values:
 * - & becomes &amp;
 * - < becomes &lt;
 * - > becomes &gt;
 * - " becomes &quot;
 * 
 * Note: Single quotes are not escaped as attribute values are always wrapped in double quotes
 * 
 * @example
 * escapeAttribute('value with "quotes" & symbols')
 * // Returns: 'value with &quot;quotes&quot; &amp; symbols'
 */
function escapeAttribute(text) {
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };
  
  return text.replace(/[&<>"]/g, char => escapeMap[char]);
}