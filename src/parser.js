import { SELF_CLOSING_TAGS } from "./constants.js";

const ROOT_ARRAY_ERROR = "YAHTML content must be an array. YAHTML documents always start with an array at the root level.";

const parseStringDeclaration = (source = "") => {
  if (source.endsWith(":")) {
    return {
      key: source.slice(0, -1).trim(),
      content: null,
    };
  }

  let colonIndex = -1;
  const doubleQuotePattern = ': "';
  const singleQuotePattern = ": '";

  const dqIndex = source.indexOf(doubleQuotePattern);
  const sqIndex = source.indexOf(singleQuotePattern);

  if (dqIndex >= 0 && (sqIndex < 0 || dqIndex < sqIndex)) {
    colonIndex = dqIndex;
  } else if (sqIndex >= 0) {
    colonIndex = sqIndex;
  } else {
    const simpleMatch = source.match(/^([^:]+?):\s+(.*)$/);
    if (simpleMatch && !simpleMatch[1].includes("//")) {
      return {
        key: simpleMatch[1],
        content: simpleMatch[2],
      };
    }
  }

  if (colonIndex < 0) {
    return null;
  }

  const key = source.substring(0, colonIndex);
  const contentStr = source.substring(colonIndex + 2);

  let content = contentStr;
  if (
    (contentStr.startsWith("\"") && contentStr.endsWith("\""))
    || (contentStr.startsWith("'") && contentStr.endsWith("'"))
  ) {
    content = contentStr.slice(1, -1);
    content = content.replace(/\\"/g, "\"").replace(/\\'/g, "'");
  }

  return {
    key,
    content: content === "\"\"" || content === "''" ? "" : content,
  };
};

const normalizeElementKey = (key = "") => key.replace(/:$/, "");

const resolveKeyToken = (token, fallbackStart) => {
  const tokenMatch = token.match(/^([^\s]+)(\s+.*)?$/);
  if (!tokenMatch) {
    return {
      selectorPart: "",
      attrsPart: "",
      attrsStartOffset: fallbackStart,
    };
  }

  const selectorPart = tokenMatch[1];
  const attrsPart = tokenMatch[2] || "";
  const leadingWhitespace = attrsPart.match(/^\s*/)?.[0].length || 0;
  const trimmedAttrs = attrsPart.trim();

  return {
    selectorPart,
    attrsPart: trimmedAttrs,
    attrsStartOffset: selectorPart.length + leadingWhitespace,
  };
};

const parseAttributeEntries = ({ attrsPart, attrsStartOffset }) => {
  const attributes = [];
  let pos = 0;

  while (pos < attrsPart.length) {
    while (pos < attrsPart.length && /\s/u.test(attrsPart[pos])) {
      pos += 1;
    }
    if (pos >= attrsPart.length) {
      break;
    }

    const nameStart = pos;
    while (pos < attrsPart.length && /[a-zA-Z-]/u.test(attrsPart[pos])) {
      pos += 1;
    }
    const name = attrsPart.substring(nameStart, pos);
    if (!name) {
      break;
    }

    const nameRange = {
      start: attrsStartOffset + nameStart,
      end: attrsStartOffset + pos,
    };

    if (attrsPart[pos] !== "=") {
      attributes.push({
        name,
        value: true,
        kind: "boolean",
        range: nameRange,
        nameRange,
      });
      continue;
    }

    pos += 1;
    let value = "";
    let quote = null;
    let valueStart = pos;
    let rawValueStart = pos;
    let rawValueEnd = pos;

    if (attrsPart[pos] === "\"") {
      quote = "\"";
      pos += 1;
      valueStart = pos;
      rawValueStart = pos - 1;
      while (pos < attrsPart.length && attrsPart[pos] !== "\"") {
        pos += 1;
      }
      value = attrsPart.substring(valueStart, pos);
      if (attrsPart[pos] === "\"") {
        pos += 1;
      }
      rawValueEnd = pos;
    } else if (attrsPart[pos] === "'") {
      quote = "'";
      pos += 1;
      valueStart = pos;
      rawValueStart = pos - 1;
      while (pos < attrsPart.length && attrsPart[pos] !== "'") {
        pos += 1;
      }
      value = attrsPart.substring(valueStart, pos);
      if (attrsPart[pos] === "'") {
        pos += 1;
      }
      rawValueEnd = pos;
    } else {
      valueStart = pos;
      rawValueStart = pos;
      while (pos < attrsPart.length && !/\s/u.test(attrsPart[pos])) {
        if (attrsPart[pos] === ":" && pos === attrsPart.length - 1) {
          break;
        }
        pos += 1;
      }
      value = attrsPart.substring(valueStart, pos);
      rawValueEnd = pos;
    }

    attributes.push({
      name,
      value,
      kind: "value",
      quote,
      range: {
        start: nameRange.start,
        end: attrsStartOffset + rawValueEnd,
      },
      nameRange,
      valueRange: {
        start: attrsStartOffset + valueStart,
        end: attrsStartOffset + valueStart + value.length,
      },
      rawValueRange: {
        start: attrsStartOffset + rawValueStart,
        end: attrsStartOffset + rawValueEnd,
      },
    });
  }

  return attributes;
};

export const parseElementKey = (key = "") => {
  const source = typeof key === "string" ? key : String(key ?? "");
  const normalizedKey = normalizeElementKey(source);

  const tokenMatch = normalizedKey.match(/^[^\s]+/u);
  if (!tokenMatch) {
    return {
      raw: source,
      normalized: normalizedKey,
      tag: "",
      id: "",
      classes: [],
      attributes: [],
      ranges: {
        tag: null,
        id: null,
        classes: [],
      },
    };
  }

  const {
    selectorPart,
    attrsPart,
    attrsStartOffset,
  } = resolveKeyToken(normalizedKey, tokenMatch[0].length);

  const attributes = parseAttributeEntries({ attrsPart, attrsStartOffset });

  let tag = "";
  let id = "";
  const classes = [];
  const classRanges = [];
  let remainingSelector = selectorPart;

  if (remainingSelector.includes("=") && !remainingSelector.match(/^[a-zA-Z0-9-]+[#.]/u)) {
    tag = "";
  } else {
    const tagMatch = remainingSelector.match(/^([a-zA-Z0-9-]+)/u);
    if (tagMatch) {
      tag = tagMatch[1];
      remainingSelector = remainingSelector.substring(tag.length);
    }
  }

  const idMatch = remainingSelector.match(/#([a-zA-Z0-9-]+)/u);
  let idRange = null;
  if (idMatch) {
    id = idMatch[1];
    const hashIndex = idMatch.index ?? -1;
    if (hashIndex >= 0) {
      idRange = {
        start: tag.length + hashIndex + 1,
        end: tag.length + hashIndex + 1 + id.length,
      };
    }
  }

  const classRegex = /\.([a-zA-Z0-9-]+)/gu;
  let classMatch = classRegex.exec(remainingSelector);
  while (classMatch) {
    const className = classMatch[1];
    const classIndex = classMatch.index ?? -1;
    classes.push(className);
    if (classIndex >= 0) {
      classRanges.push({
        start: tag.length + classIndex + 1,
        end: tag.length + classIndex + 1 + className.length,
      });
    }
    classMatch = classRegex.exec(remainingSelector);
  }

  return {
    raw: source,
    normalized: normalizedKey,
    tag,
    id,
    classes,
    attributes,
    ranges: {
      tag: tag
        ? {
          start: 0,
          end: tag.length,
        }
        : null,
      id: idRange,
      classes: classRanges,
    },
  };
};

const toRawHtmlNode = ({ value, path }) => ({
  type: "rawHtml",
  value: String(value ?? ""),
  path,
});

const toTextNode = ({ value, path }) => ({
  type: "text",
  value: String(value),
  path,
});

const pushOrReplaceIdAttribute = ({ attributes, idValue, source }) => {
  if (typeof idValue !== "string" || idValue.length === 0) {
    return;
  }

  const existingIndex = attributes.findIndex((attr) => attr.name === "id");
  if (existingIndex >= 0) {
    attributes.splice(existingIndex, 1);
  }

  attributes.push({
    name: "id",
    value: idValue,
    source,
  });
};

const pushOrReplaceClassAttribute = ({ attributes, classValue, source }) => {
  if (typeof classValue !== "string" || classValue.length === 0) {
    return;
  }

  const existingIndex = attributes.findIndex((attr) => attr.name === "class");
  if (existingIndex >= 0) {
    attributes.splice(existingIndex, 1);
  }

  attributes.push({
    name: "class",
    value: classValue,
    source,
  });
};

const buildElementAttributes = ({ keyMeta, objectValue }) => {
  const mergedAttributes = [];

  const inlineAttributes = keyMeta.attributes.map((attr) => ({
    name: attr.name,
    value: attr.value,
    kind: attr.kind,
    source: "inline",
  }));

  const classAttr = inlineAttributes.find((attr) => attr.name === "class" && typeof attr.value === "string");
  const classAttrValues = classAttr
    ? classAttr.value.split(" ").filter(Boolean)
    : [];
  const allClasses = [...keyMeta.classes, ...classAttrValues];

  if (keyMeta.id) {
    pushOrReplaceIdAttribute({
      attributes: mergedAttributes,
      idValue: keyMeta.id,
      source: "selector",
    });
  }
  if (allClasses.length > 0) {
    pushOrReplaceClassAttribute({
      attributes: mergedAttributes,
      classValue: allClasses.join(" "),
      source: classAttr ? "selector+inline" : "selector",
    });
  }

  inlineAttributes.forEach((attr) => {
    if (attr.name === "class") {
      return;
    }
    if (attr.name === "id") {
      pushOrReplaceIdAttribute({
        attributes: mergedAttributes,
        idValue: String(attr.value ?? ""),
        source: "inline",
      });
      return;
    }
    mergedAttributes.push(attr);
  });

  if (!(objectValue && typeof objectValue === "object" && !Array.isArray(objectValue) && "children" in objectValue)) {
    return mergedAttributes;
  }

  Object.entries(objectValue).forEach(([attrName, attrValue]) => {
    if (attrName === "children") {
      return;
    }

    if (mergedAttributes.some((existing) => existing.name === attrName)) {
      return;
    }

    if (attrValue === true) {
      mergedAttributes.push({
        name: attrName,
        value: true,
        kind: "boolean",
        source: "object",
      });
      return;
    }

    if (attrValue === "") {
      mergedAttributes.push({
        name: attrName,
        value: "",
        kind: "value",
        source: "object",
      });
      return;
    }

    mergedAttributes.push({
      name: attrName,
      value: String(attrValue),
      kind: "value",
      source: "object",
    });
  });

  return mergedAttributes;
};

const parseChildArray = ({ content, path, parseElement }) => {
  const children = [];

  content.forEach((child, index) => {
    if (Array.isArray(child)) {
      children.push(...parseChildArray({
        content: child,
        path: [...path, index],
        parseElement,
      }));
      return;
    }

    const parsedChild = parseElement({ element: child, path: [...path, index] });
    if (parsedChild) {
      children.push(parsedChild);
    }
  });

  return children;
};

const parseObjectElement = ({ element, path, parseElement }) => {
  if (element instanceof Date) {
    throw new TypeError("Date objects cannot be used as content. Convert to string first (e.g., date.toISOString() or date.toLocaleDateString())");
  }

  if ("__html" in element) {
    return toRawHtmlNode({
      value: element.__html,
      path,
    });
  }

  const key = Object.keys(element)[0];
  if (!key) {
    throw new Error("Malformed YAHTML element: empty element key");
  }

  const value = element[key];
  if (value instanceof Date) {
    throw new TypeError("Date objects cannot be used as element content. Convert to string first (e.g., date.toISOString() or date.toLocaleDateString())");
  }

  if (key.startsWith("\"!DOCTYPE") || key.startsWith("!DOCTYPE")) {
    return {
      type: "doctype",
      value: "html",
      path,
      rawKey: key,
    };
  }

  const keyMeta = parseElementKey(key);
  if (!keyMeta.tag) {
    throw new Error(`Malformed YAHTML element: "${key}" - element must have a valid tag name`);
  }

  const attributes = buildElementAttributes({
    keyMeta,
    objectValue: value,
  });

  const node = {
    type: "element",
    path,
    rawKey: key,
    key: keyMeta,
    tag: keyMeta.tag,
    selfClosing: SELF_CLOSING_TAGS.includes(keyMeta.tag),
    attributes,
    children: [],
  };

  if (node.selfClosing) {
    return node;
  }

  if (Array.isArray(value)) {
    node.children = parseChildArray({
      content: value,
      path: [...path, "children"],
      parseElement,
    });
    return node;
  }

  if (typeof value === "object" && value !== null && "children" in value) {
    const children = value.children;

    if (Array.isArray(children)) {
      node.children = parseChildArray({
        content: children,
        path: [...path, "children"],
        parseElement,
      });
      return node;
    }

    if (children !== null && children !== undefined && children !== "") {
      if (children instanceof Date) {
        throw new TypeError("Date objects cannot be used as element content. Convert to string first (e.g., date.toISOString() or date.toLocaleDateString())");
      }
      if (typeof children === "object" && children !== null && "__html" in children) {
        node.children = [toRawHtmlNode({
          value: children.__html,
          path: [...path, "children", 0],
        })];
      } else {
        node.children = [toTextNode({
          value: children,
          path: [...path, "children", 0],
        })];
      }
    }

    return node;
  }

  if (value !== null && value !== undefined && value !== "") {
    if (typeof value === "object" && "__html" in value) {
      node.children = [toRawHtmlNode({
        value: value.__html,
        path: [...path, "children", 0],
      })];
    } else {
      node.children = [toTextNode({
        value,
        path: [...path, "children", 0],
      })];
    }
  }

  return node;
};

export const parseYahtmlAst = (yahtmlContent) => {
  if (!Array.isArray(yahtmlContent)) {
    throw new TypeError(ROOT_ARRAY_ERROR);
  }

  const parseElement = ({ element, path }) => {
    if (element === null || element === undefined) {
      return null;
    }

    if (typeof element === "string") {
      const declaration = parseStringDeclaration(element);
      if (declaration) {
        return parseObjectElement({
          element: { [declaration.key]: declaration.content },
          path,
          parseElement,
        });
      }
      return toTextNode({
        value: element,
        path,
      });
    }

    if (typeof element === "number" || typeof element === "boolean") {
      return toTextNode({
        value: element,
        path,
      });
    }

    if (Array.isArray(element)) {
      return {
        type: "fragment",
        path,
        children: parseChildArray({
          content: element,
          path,
          parseElement,
        }),
      };
    }

    if (typeof element === "object") {
      return parseObjectElement({
        element,
        path,
        parseElement,
      });
    }

    return null;
  };

  const children = [];
  yahtmlContent.forEach((element, index) => {
    const node = parseElement({
      element,
      path: [index],
    });
    if (node) {
      children.push(node);
    }
  });

  return {
    type: "root",
    children,
  };
};
