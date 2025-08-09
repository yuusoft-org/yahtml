# YAHTML Documentation

## What is YAHTML?

YAHTML (YAML HTML) lets you write HTML as valid YAML. It's more concise than HTML while maintaining full expressiveness. Since it's valid YAML, you get structured data that can be parsed as YAML/JSON.

## Quick Example

**YAHTML - Clean and concise:**
```yaml
- div#home:
  - div.header:
    - h2.title: "Welcome"
  - div.body:
    - p.text: "Hello World!"
```

**Traditional HTML - More verbose:**
```html
<div id="home">
  <div class="header">
    <h2 class="title">Welcome</h2>
  </div>
  <div class="body">
    <p class="text">Hello World!</p>
  </div>
</div>
```

## Philosophy & Motivation

### Why YAHTML?

HTML, while powerful and ubiquitous, has several pain points that YAHTML addresses:

**1. Visual Noise**
HTML's angle brackets, closing tags, and attribute syntax create visual clutter that obscures the actual content structure.

**2. Redundancy**
Every opening tag requires a corresponding closing tag, doubling the markup for structure:
- `<div>` requires `</div>`
- `<section>` requires `</section>`
- Nested structures multiply this redundancy

**3. Poor Structure Visibility**
In complex HTML documents, it's difficult to see the hierarchical structure at a glance. Indentation helps but isn't enforced, and closing tags add noise.

### The YAHTML Solution

YAHTML leverages YAML's natural strengths to create a more elegant markup language:

**1. Structure Through Indentation**
The hierarchy is immediately visible through enforced indentation.

**2. Extreme Conciseness**
- No closing tags needed
- Minimal syntax for attributes
- ID and class notation with dots (`div#home.card.active`)

**3. Less Visual Noise**
By removing angle brackets and closing tags, the content and structure become the focus:
```yaml
# YAHTML
- nav.primary-nav:
  - a href="/home": "Home"
  - a href="/about": "About"
```

vs

```html
<!-- HTML -->
<nav class="primary-nav">
  <a href="/home">Home</a>
  <a href="/about">About</a>
</nav>
```

### Key Features

1. **100% Valid YAML**: Every YAHTML document is syntactically valid YAML
2. **HTML Complete**: Can express any HTML structure or element
3. **Syntactic Conveniences**: Streamlined notation for IDs (#), classes (.), and optional quotes for single-word attributes

### Trade-offs and Limitations

YAHTML makes conscious trade-offs:

**Limitations:**
1. **Line Length**: Complex elements with many attributes can create long lines
   ```yaml
   - div class="card featured" id="main-card" data-category="premium" style="transform: rotate(45deg); position: relative;": "Content"
   ```
If you have a lot of long attributes and attribute values, YAHTML won't really make sense for you.

## Document Structure

### Arrays All the Way Down

In YAHTML, **everything is always an array**, starting from the root. This consistent structure ensures predictable parsing and allows any element to have children.

```yaml
- element-declaration
- element-declaration
# ...
```

The only exception is the leaf nodes (final content). If an element's value is not an array, it cannot have children:

```yaml
- div:                   # Array value - can have children
  - p: "Hello"           # String value - cannot have children
  - div:                 # Array value - can have children
    - span: "World"      # String value - cannot have children
```


## Basic Elements

### Simple Elements
```yaml
- h1: "Page Title"
- p: "Some text content"
- br:  # Self-closing element
```

### Nested Elements
```yaml
- div.card:
  - h2: "Card Title"
  - p: "Card description goes here."
  - button: "Learn More"
```

## IDs and Classes

Use `#` to add IDs and `.` to add classes to elements:

```yaml
- button#submit-btn: "Submit"
- div.card.featured: "Featured content"
```

This creates:
```html
<button id="submit-btn">Submit</button>
<div class="card featured">Featured content</div>
```

The notation:
- `button.primary` → `<button class="primary">`
- `button.primary.large` → `<button class="primary large">`
- `div#main.container.fluid` → `<div id="main" class="container fluid">`

## Attributes

YAHTML uses standard HTML attributes. Quotes are optional for attribute values without spaces:

```yaml
- div class=container id=main:  # No quotes needed for single words
- div class="container fluid":   # Quotes required for values with spaces
- img src=photo.jpg alt="A photo":
- input type=email name=user-email required:
- a href=https://example.com target=_blank: "External Link"
```

### Style Attribute
The `style` attribute works like any other standard HTML attribute:
```yaml
- div style="width: 300px; height: 200px; background-color: #f0f0f0;":
- p style="color: red; font-size: 18px;": "Styled text"
- div style="transform: translate(10px, 20px); opacity: 0.8;":
```


## Best Practices

Use consistent 2-space indentation throughout the document to keep it concise.

*Note*: Prettier formatter will always uses 4-space indentation for YAML arrays

## Why Not HAML or Pug?

The main difference is that YAHTML document is 100% valid YAML, allowing it to leverage existing YAML tooling and integrate seamlessly with YAML-based configurations. Anything that can read a JSON can read a YAHTML, no need for special purpose parser.

## JavaScript/TypeScript Usage

### Installation

```bash
npm install yahtml
```

Or with Bun:
```bash
bun add yahtml
```

### Quick Example

```javascript
import { convertToHtml } from 'yahtml';

const yhtmlContent = [
  {
    'div#app.container': [
      'h1: "My Page"',
      'p: "Welcome to YAHTML!"',
      'button.primary: "Click me"'
    ]
  }
];

const html = convertToHtml(yhtmlContent);
console.log(html);
// Output: <div id="app" class="container"><h1>My Page</h1><p>Welcome to YAHTML!</p><button class="primary">Click me</button></div>
```

### API Documentation

#### `convertToHtml(yhtmlContent)`

Converts a YAHTML array to an HTML string.

**Parameters:**
- `yhtmlContent` (Array): The YAHTML content as an array

**Returns:**
- (string): The converted HTML string

**Throws:**
- `TypeError`: If yhtmlContent is not an array
- `Error`: If element structure is malformed

#### `SELF_CLOSING_TAGS`

An array of HTML5 void elements (self-closing tags).

```javascript
import { SELF_CLOSING_TAGS } from 'yahtml';
console.log(SELF_CLOSING_TAGS);
// ['br', 'hr', 'img', 'input', 'meta', ...]
```

### TypeScript Support

YAHTML includes TypeScript definitions out of the box.

```typescript
import { convertToHtml } from 'yahtml';

const content = [
  'h1: "Hello TypeScript"'
];

const html: string = convertToHtml(content);
```

### Performance

YAHTML is optimized for performance:
- **~90,000 ops/sec** for simple elements
- **~20,000 ops/sec** for real-world pages
- **~200,000 ops/sec** for HTML escaping



