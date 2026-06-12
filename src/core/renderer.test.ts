import { describe, it, expect } from "vitest";
import { renderDocLang, renderDocLangToHTML, renderDocLangToVNodes } from "./renderer";
import type { DocLangDocument, VNode } from "./types";

function asVNode(val: VNode | string): VNode {
  return val as VNode;
}

function findChildByTag(parent: VNode, tag: string): VNode | undefined {
  return parent.children.find((c): c is VNode => typeof c !== "string" && c.tag === tag);
}

function makeDoc(children: DocLangDocument["children"]): DocLangDocument {
  return { version: "0.6", children };
}

describe("renderDocLangToVNodes", () => {
  it("renders heading as h1-h6", () => {
    for (let level = 1; level <= 6; level++) {
      const doc = makeDoc([{
        type: "heading", level, children: [{ type: "content", text: "Title" }],
      }]);
      const vnodes = renderDocLangToVNodes(doc);
      expect(vnodes[0].tag).toBe(`h${level}`);
      expect(vnodes[0].children).toContain("Title");
    }
  });

  it("renders text as p", () => {
    const doc = makeDoc([{ type: "text", children: [{ type: "content", text: "Hello" }] }]);
    const vnodes = renderDocLangToVNodes(doc);
    expect(vnodes[0].tag).toBe("p");
  });

  it("renders code as pre > code", () => {
    const doc = makeDoc([{ type: "code", children: [{ type: "content", text: 'let x = 1;' }] }]);
    const vnodes = renderDocLangToVNodes(doc);
    expect(vnodes[0].tag).toBe("pre");
    expect(asVNode(vnodes[0].children[0]).tag).toBe("code");
  });

  it("renders formula as div.dl-formula", () => {
    const doc = makeDoc([{ type: "formula", children: [{ type: "content", text: "E=mc^2" }] }]);
    const vnodes = renderDocLangToVNodes(doc);
    expect(vnodes[0].tag).toBe("div");
    expect(vnodes[0].props.class).toBe("dl-formula");
  });

  it("renders page_break as hr", () => {
    const doc = makeDoc([{ type: "page_break" }]);
    const vnodes = renderDocLangToVNodes(doc);
    expect(vnodes[0].tag).toBe("hr");
    expect(vnodes[0].props.class).toBe("dl-page-break");
  });

  it("renders unordered list as ul with li items", () => {
    const doc = makeDoc([{
      type: "list",
      listClass: "unordered",
      items: [
        { children: [{ type: "content", text: "A" }] },
        { children: [{ type: "content", text: "B" }] },
      ],
    }]);
    const vnodes = renderDocLangToVNodes(doc);
    expect(vnodes[0].tag).toBe("ul");
    expect(vnodes[0].children).toHaveLength(2);
    expect(asVNode(vnodes[0].children[0]).tag).toBe("li");
  });

  it("renders ordered list as ol", () => {
    const doc = makeDoc([{
      type: "list",
      listClass: "ordered",
      items: [{ children: [{ type: "content", text: "Item" }] }],
    }]);
    const vnodes = renderDocLangToVNodes(doc);
    expect(vnodes[0].tag).toBe("ol");
  });

  it("renders table with thead/tbody", () => {
    const doc = makeDoc([{
      type: "table",
      grid: {
        rows: [
          [{ isHeader: true, rowspan: 1, colspan: 1, content: [{ type: "content", text: "H1" }] }],
          [{ isHeader: false, rowspan: 1, colspan: 1, content: [{ type: "content", text: "V1" }] }],
        ],
      },
    }]);
    const vnodes = renderDocLangToVNodes(doc);
    const wrapper = vnodes[0];
    expect(wrapper.tag).toBe("div");
    const table = asVNode(wrapper.children[0]);
    expect(table.tag).toBe("table");
    const thead = findChildByTag(table, "thead");
    const tbody = findChildByTag(table, "tbody");
    expect(thead).toBeDefined();
    expect(tbody).toBeDefined();
  });

  it("renders table cell with rowspan/colspan", () => {
    const doc = makeDoc([{
      type: "table",
      grid: {
        rows: [
          [{ isHeader: false, rowspan: 2, colspan: 3, content: [{ type: "content", text: "Big" }] }],
        ],
      },
    }]);
    const vnodes = renderDocLangToVNodes(doc);
    const table = asVNode(vnodes[0].children[0]);
    const tbody = findChildByTag(table, "tbody")!;
    const tr = asVNode(tbody.children[0]);
    const td = asVNode(tr.children[0]);
    expect(td.props.rowspan).toBe(2);
    expect(td.props.colspan).toBe(3);
  });

  it("renders picture as figure with img", () => {
    const doc = makeDoc([{
      type: "picture",
      srcUri: "test.png",
      children: [],
    }]);
    const vnodes = renderDocLangToVNodes(doc);
    expect(vnodes[0].tag).toBe("figure");
    const img = findChildByTag(vnodes[0], "img");
    expect(img).toBeDefined();
    expect(img!.props.src).toBe("test.png");
  });

  it("renders formatting elements", () => {
    const formatMap: Record<string, string> = {
      bold: "strong",
      italic: "em",
      strikethrough: "del",
      underline: "u",
      superscript: "sup",
      subscript: "sub",
    };
    for (const [tag, htmlTag] of Object.entries(formatMap)) {
      const doc = makeDoc([{
        type: "text",
        children: [{ type: "formatting", tag: tag as any, children: [{ type: "content", text: "x" }] }],
      }]);
      const vnodes = renderDocLangToVNodes(doc);
      expect(asVNode(vnodes[0].children[0]).tag).toBe(htmlTag);
    }
  });

  it("renders rtl as bdi with dir attr", () => {
    const doc = makeDoc([{
      type: "text",
      children: [{ type: "formatting", tag: "rtl", children: [{ type: "content", text: "مرحبا" }] }],
    }]);
    const vnodes = renderDocLangToVNodes(doc);
    expect(asVNode(vnodes[0].children[0]).tag).toBe("bdi");
    expect(asVNode(vnodes[0].children[0]).props.dir).toBe("rtl");
  });

  it("renders element head as data attributes", () => {
    const doc = makeDoc([{
      type: "heading",
      level: 1,
      head: {
        label: "title",
        location: { x0: 10, y0: 20, x1: 100, y1: 50 },
        layer: "body",
      },
      children: [{ type: "content", text: "H" }],
    }]);
    const vnodes = renderDocLangToVNodes(doc);
    expect(vnodes[0].props["data-dl-label"]).toBe("title");
    expect(vnodes[0].props["data-dl-x0"]).toBe(10);
    expect(vnodes[0].props["data-dl-y1"]).toBe(50);
    expect(vnodes[0].props["data-dl-layer"]).toBe("body");
  });
});

describe("renderDocLangToHTML", () => {
  it("wraps output in dl-document div", () => {
    const doc = makeDoc([{ type: "page_break" }]);
    const html = renderDocLangToHTML(doc);
    expect(html).toContain('class="dl-document"');
  });

  it("escapes HTML in text content", () => {
    const doc = makeDoc([{ type: "text", children: [{ type: "content", text: "<script>alert(1)</script>" }] }]);
    const html = renderDocLangToHTML(doc);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
  });

  it("renders void elements as self-closing", () => {
    const doc = makeDoc([{ type: "page_break" }]);
    const html = renderDocLangToHTML(doc);
    expect(html).toContain("<hr");
  });
});

describe("renderDocLang (full output)", () => {
  it("returns html, vnodes, and css", () => {
    const doc = makeDoc([{ type: "text", children: [{ type: "content", text: "Hi" }] }]);
    const output = renderDocLang(doc);
    expect(output.html).toContain("Hi");
    expect(output.vnodes).toHaveLength(1);
    expect(output.css).toContain("dl-document");
  });
});
