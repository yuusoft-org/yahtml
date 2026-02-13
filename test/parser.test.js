import { describe, expect, it } from "vitest";
import { convertToHtml, parseElementKey, parseYahtmlAst } from "../index.js";

describe("parser api", () => {
  it("parses element keys with selector parts, attrs, and ranges", () => {
    const parsed = parseElementKey("div#main.card.active class=\"extra one\" data-id=123 required:");

    expect(parsed.tag).toBe("div");
    expect(parsed.id).toBe("main");
    expect(parsed.classes).toEqual(["card", "active"]);
    expect(parsed.ranges.tag).toEqual({ start: 0, end: 3 });
    expect(parsed.ranges.id).toEqual({ start: 4, end: 8 });
    expect(parsed.ranges.classes).toEqual([
      { start: 9, end: 13 },
      { start: 14, end: 20 },
    ]);
    expect(parsed.attributes.map((attr) => [attr.name, attr.value])).toEqual([
      ["class", "extra one"],
      ["data-id", "123"],
      ["required", true],
    ]);
  });

  it("builds ast nodes for nested YAHTML structures", () => {
    const ast = parseYahtmlAst([
      {
        "div#home.card class=\"extra\"": [
          "h1.title: \"Welcome\"",
          { p: "Body" },
          { span: { children: { __html: "<b>raw</b>" } } },
        ],
      },
    ]);

    expect(ast.type).toBe("root");
    expect(ast.children).toHaveLength(1);

    const root = ast.children[0];
    expect(root.type).toBe("element");
    expect(root.tag).toBe("div");
    expect(root.attributes).toEqual([
      { name: "id", value: "home", source: "selector" },
      { name: "class", value: "card extra", source: "selector+inline" },
    ]);
    expect(root.children).toHaveLength(3);

    const titleNode = root.children[0];
    expect(titleNode.type).toBe("element");
    expect(titleNode.tag).toBe("h1");
    expect(titleNode.children[0]).toMatchObject({
      type: "text",
      value: "Welcome",
    });

    const rawNode = root.children[2].children[0];
    expect(rawNode).toEqual({
      type: "rawHtml",
      value: "<b>raw</b>",
      path: [0, "children", 2, "children", 0],
    });
  });

  it("keeps converter behavior unchanged for existing YAHTML", () => {
    const html = convertToHtml([
      "h1: \"Title\"",
      { div: ["p: \"Hello\""] },
    ]);

    expect(html).toBe("<h1>Title</h1><div><p>Hello</p></div>");
  });

  it("throws the same root-array validation error", () => {
    expect(() => parseYahtmlAst({ div: "x" })).toThrow(
      "YAHTML content must be an array. YAHTML documents always start with an array at the root level.",
    );
  });

  it("throws malformed element errors for invalid selectors", () => {
    expect(() => parseYahtmlAst(["#id-only.class-only: \"content\""])).toThrow(
      "Malformed YAHTML element: \"#id-only.class-only\" - element must have a valid tag name",
    );
  });
});
