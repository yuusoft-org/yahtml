import { convertToHtml } from '../src/yhtml.js';

// Helper to measure execution time
function benchmark(name, fn, iterations = 1000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const totalTime = end - start;
  const avgTime = totalTime / iterations;
  
  console.log(`${name}:`);
  console.log(`  Total: ${totalTime.toFixed(2)}ms for ${iterations} iterations`);
  console.log(`  Average: ${avgTime.toFixed(4)}ms per conversion`);
  console.log(`  Ops/sec: ${(1000 / avgTime).toFixed(0)}`);
  console.log('');
  
  return avgTime;
}

// Test data generators
function generateSimpleElements(count) {
  const elements = [];
  for (let i = 0; i < count; i++) {
    elements.push(`p: "Paragraph ${i}"`);
  }
  return elements;
}

function generateNestedStructure(depth, breadth = 2) {
  if (depth === 0) {
    return `span: "Leaf content"`;
  }
  
  const children = [];
  for (let i = 0; i < breadth; i++) {
    children.push(generateNestedStructure(depth - 1, breadth));
  }
  
  return {
    div: children
  };
}

function generateComplexForm() {
  return [
    {
      'form action="/submit" method="post"': [
        'h2: "User Registration"',
        {
          'div.form-group': [
            'label for=name: "Full Name"',
            'input type=text id=name name=name required:'
          ]
        },
        {
          'div.form-group': [
            'label for=email: "Email"',
            'input type=email id=email name=email required:'
          ]
        },
        {
          'div.form-group': [
            'label for=password: "Password"',
            'input type=password id=password name=password required:'
          ]
        },
        {
          'div.form-group': [
            'label for=country: "Country"',
            {
              'select id=country name=country': [
                'option value=us: "United States"',
                'option value=uk: "United Kingdom"',
                'option value=ca: "Canada"',
                'option value=au: "Australia"'
              ]
            }
          ]
        },
        'button type=submit: "Register"'
      ]
    }
  ];
}

function generateLargeTable(rows, cols) {
  const tbody = [];
  for (let i = 0; i < rows; i++) {
    const cells = [];
    for (let j = 0; j < cols; j++) {
      cells.push(`td: "Cell ${i}-${j}"`);
    }
    tbody.push({ tr: cells });
  }
  
  const thead = [];
  for (let j = 0; j < cols; j++) {
    thead.push(`th: "Column ${j}"`);
  }
  
  return [
    {
      table: [
        { thead: [{ tr: thead }] },
        { tbody: tbody }
      ]
    }
  ];
}

function generateRealWorldPage() {
  return [
    {
      'div#app.container': [
        {
          'header.site-header': [
            {
              'nav.navbar': [
                'a href="/" class="logo": "YHTML"',
                {
                  'ul.nav-menu': [
                    { li: ['a href="/features": "Features"'] },
                    { li: ['a href="/docs": "Documentation"'] },
                    { li: ['a href="/pricing": "Pricing"'] },
                    { li: ['a href="/contact": "Contact"'] }
                  ]
                }
              ]
            }
          ]
        },
        {
          'main.content': [
            {
              'section.hero': [
                'h1.hero-title: "Build HTML with YAML Simplicity"',
                'p.hero-subtitle: "Write cleaner, more maintainable markup with YHTML"',
                {
                  'div.cta-buttons': [
                    'button.btn.btn-primary: "Get Started"',
                    'button.btn.btn-secondary: "Learn More"'
                  ]
                }
              ]
            },
            {
              'section.features': [
                'h2: "Features"',
                {
                  'div.feature-grid': [
                    {
                      'div.feature-card': [
                        'h3: "Simple Syntax"',
                        'p: "Write HTML using clean YAML syntax"'
                      ]
                    },
                    {
                      'div.feature-card': [
                        'h3: "No Closing Tags"',
                        'p: "Forget about closing tags and focus on content"'
                      ]
                    },
                    {
                      'div.feature-card': [
                        'h3: "Valid YAML"',
                        'p: "Every YHTML document is valid YAML"'
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          'footer.site-footer': [
            'p: "© 2024 YHTML. All rights reserved."',
            {
              'div.social-links': [
                'a href="https://github.com": "GitHub"',
                'a href="https://twitter.com": "Twitter"'
              ]
            }
          ]
        }
      ]
    }
  ];
}

console.log('===========================================');
console.log('YHTML to HTML Converter Performance Tests');
console.log('===========================================\n');

// Test 1: Simple elements
console.log('TEST 1: Simple Elements (10 paragraphs)');
console.log('------------------------------------------');
const simple10 = generateSimpleElements(10);
benchmark('10 simple paragraphs', () => convertToHtml(simple10), 10000);

// Test 2: More simple elements
console.log('TEST 2: Simple Elements (100 paragraphs)');
console.log('------------------------------------------');
const simple100 = generateSimpleElements(100);
benchmark('100 simple paragraphs', () => convertToHtml(simple100), 1000);

// Test 3: Nested structure (shallow)
console.log('TEST 3: Nested Structure (3 levels deep)');
console.log('------------------------------------------');
const nested3 = [generateNestedStructure(3, 3)];
benchmark('3-level nested structure', () => convertToHtml(nested3), 5000);

// Test 4: Nested structure (deep)
console.log('TEST 4: Nested Structure (7 levels deep)');
console.log('------------------------------------------');
const nested7 = [generateNestedStructure(7, 2)];
benchmark('7-level nested structure', () => convertToHtml(nested7), 1000);

// Test 5: Complex form
console.log('TEST 5: Complex Form');
console.log('------------------------------------------');
const complexForm = generateComplexForm();
benchmark('Complex form', () => convertToHtml(complexForm), 5000);

// Test 6: Large table
console.log('TEST 6: Large Table (50x10)');
console.log('------------------------------------------');
const largeTable = generateLargeTable(50, 10);
benchmark('50x10 table', () => convertToHtml(largeTable), 100);

// Test 7: Real-world page
console.log('TEST 7: Real-World Page');
console.log('------------------------------------------');
const realWorldPage = generateRealWorldPage();
benchmark('Real-world page', () => convertToHtml(realWorldPage), 2000);

// Test 8: Attribute-heavy elements
console.log('TEST 8: Attribute-Heavy Elements');
console.log('------------------------------------------');
const attrHeavy = [
  'div#main.container.fluid class="extra classes here" style="margin: 10px; padding: 20px;" data-id="123" data-category="test": "Content"',
  'img src="https://example.com/image.jpg" alt="Test Image" width="800" height="600" class="responsive":'
];
benchmark('Attribute-heavy elements', () => convertToHtml(attrHeavy), 10000);

// Test 9: Mixed content with escaping
console.log('TEST 9: Content with HTML Escaping');
console.log('------------------------------------------');
const escapingContent = [
  'p: "This & that < more > stuff"',
  'div: "She said \\"Hello\\" & goodbye"',
  'span: "<script>alert(1)</script>"'
];
benchmark('HTML escaping', () => convertToHtml(escapingContent), 10000);

// Test 10: Edge cases
console.log('TEST 10: Edge Cases');
console.log('------------------------------------------');
const edgeCases = [
  { div: null },
  { span: '' },
  { p: 42 },
  { em: true },
  null,
  'just text',
  { 'style': 'body { font-family: sans-serif; }' }
];
benchmark('Edge cases', () => convertToHtml(edgeCases), 10000);

// Summary
console.log('===========================================');
console.log('Performance Test Complete');
console.log('===========================================');

// Create a stress test to find limits
console.log('\nSTRESS TEST: Finding limits...');
console.log('------------------------------------------');

let depth = 10;
let success = true;
while (success && depth <= 100) {
  try {
    const deepNest = [generateNestedStructure(depth, 2)];
    const start = performance.now();
    convertToHtml(deepNest);
    const time = performance.now() - start;
    console.log(`Depth ${depth}: ${time.toFixed(2)}ms`);
    
    if (time > 100) {
      console.log(`Performance degrades at depth ${depth} (>100ms)`);
      break;
    }
    depth += 10;
  } catch (e) {
    console.log(`Stack overflow at depth ${depth}`);
    success = false;
  }
}

console.log('\n✅ All performance tests completed!');