# YHTML Documentation

## What is YHTML?

YHTML (YAML HTML) lets you write HTML as valid YAML. It's more concise than HTML while maintaining full expressiveness. Since it's valid YAML, you get structured data that can be parsed as YAML/JSON.

## Quick Example

**YHTML - Clean and concise:**
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

### Why YHTML?

HTML, while powerful and ubiquitous, has several pain points that YHTML addresses:

**1. Visual Noise**
HTML's angle brackets, closing tags, and attribute syntax create visual clutter that obscures the actual content structure.

**2. Redundancy**
Every opening tag requires a corresponding closing tag, doubling the markup for structure:
- `<div>` requires `</div>`
- `<section>` requires `</section>`
- Nested structures multiply this redundancy

**3. Poor Structure Visibility**
In complex HTML documents, it's difficult to see the hierarchical structure at a glance. Indentation helps but isn't enforced, and closing tags add noise.

### The YHTML Solution

YHTML leverages YAML's natural strengths to create a more elegant markup language:

**1. Structure Through Indentation**
The hierarchy is immediately visible through enforced indentation.

**2. Extreme Conciseness**
- No closing tags needed
- Minimal syntax for attributes
- ID and class notation with dots (`div#home.card.active`)

**3. Less Visual Noise**
By removing angle brackets and closing tags, the content and structure become the focus:
```yaml
# YHTML
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

1. **100% Valid YAML**: Every YHTML document is syntactically valid YAML
2. **HTML Complete**: Can express any HTML structure or element
3. **Syntactic Conveniences**: Streamlined notation for IDs (#), classes (.), and optional quotes for single-word attributes

### Trade-offs and Limitations

YHTML makes conscious trade-offs:

**Limitations:**
1. **Line Length**: Complex elements with many attributes can create long lines
   ```yaml
   - div class="card featured" id="main-card" data-category="premium" style="transform: rotate(45deg); position: relative;": "Content"
   ```
If you have a lot of long attributes and attribute values, YHTML won't really make sense for you.

## Document Structure

### Arrays All the Way Down

In YHTML, **everything is always an array**, starting from the root. This consistent structure ensures predictable parsing and allows any element to have children.

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

YHTML uses standard HTML attributes. Quotes are optional for attribute values without spaces:

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

The main difference is that YHTML document is 100% valid YAML, allowing it to leverage existing YAML tooling and integrate seamlessly with YAML-based configurations. Anything that can read a JSON can read a YHTML, no need for special purpose parser.



