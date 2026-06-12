import { describe, it, expect } from "vitest";
import { parseDocLang } from "./parser";

const NS = `xmlns="https://www.doclang.ai/ns/v0"`;

function wrap(content: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><doclang version="0.6" ${NS}>${content}</doclang>`;
}

describe("parseDocLang", () => {
  it("parses empty doclang root", () => {
    const doc = parseDocLang(wrap(""));
    expect(doc.version).toBe("0.6");
    expect(doc.children).toEqual([]);
  });

  it("parses doclang without namespace", () => {
    const doc = parseDocLang(`<?xml version="1.0"?><doclang version="0.5"></doclang>`);
    expect(doc.version).toBe("0.5");
  });

  it("parses doclang with prefixed namespace", () => {
    const doc = parseDocLang(`<?xml version="1.0"?><dl:doclang xmlns:dl="https://www.doclang.ai/ns/v0" version="0.6"></dl:doclang>`);
    expect(doc.version).toBe("0.6");
  });

  it("throws on invalid XML", () => {
    expect(() => parseDocLang("<not xml")).toThrow();
  });

  it("throws on wrong root element", () => {
    expect(() => parseDocLang(`<?xml version="1.0"?><html></html>`)).toThrow("expected <doclang>");
  });

  describe("head", () => {
    it("parses default_resolution", () => {
      const doc = parseDocLang(wrap(`<head><default_resolution width="1024" height="768"/></head>`));
      expect(doc.defaultResolution).toEqual({ width: 1024, height: 768 });
      expect(doc.head?.defaultResolution).toEqual({ width: 1024, height: 768 });
    });

    it("handles missing head", () => {
      const doc = parseDocLang(wrap(""));
      expect(doc.head).toBeUndefined();
      expect(doc.defaultResolution).toBeUndefined();
    });
  });

  describe("heading", () => {
    it("parses heading with level", () => {
      const doc = parseDocLang(wrap(`<heading level="1">Title</heading>`));
      expect(doc.children[0]).toEqual({
        type: "heading",
        level: 1,
        head: undefined,
        children: [{ type: "content", text: "Title" }],
      });
    });

    it("defaults level to 1", () => {
      const doc = parseDocLang(wrap(`<heading>No level</heading>`));
      expect(doc.children[0].type).toBe("heading");
      expect((doc.children[0] as any).level).toBe(1);
    });

    it("clamps level to 1-6", () => {
      const doc = parseDocLang(wrap(`<heading level="99">Big</heading>`));
      expect((doc.children[0] as any).level).toBe(6);
    });

    it("parses heading with formatting", () => {
      const doc = parseDocLang(wrap(`<heading level="2"><bold>Bold Title</bold></heading>`));
      const h = doc.children[0] as any;
      expect(h.type).toBe("heading");
      expect(h.children[0]).toEqual({
        type: "formatting",
        tag: "bold",
        children: [{ type: "content", text: "Bold Title" }],
      });
    });
  });

  describe("text", () => {
    it("parses simple text", () => {
      const doc = parseDocLang(wrap(`<text>Hello world</text>`));
      expect(doc.children[0]).toEqual({
        type: "text",
        head: undefined,
        children: [{ type: "content", text: "Hello world" }],
      });
    });

    it("parses text with content element", () => {
      const doc = parseDocLang(wrap(`<text><content>Wrapped text</content></text>`));
      const t = doc.children[0] as any;
      expect(t.children[0].text).toBe("Wrapped text");
    });
  });

  describe("formatting", () => {
    const tags = ["bold", "italic", "strikethrough", "underline", "superscript", "subscript", "rtl", "handwriting"];
    for (const tag of tags) {
      it(`parses <${tag}> formatting`, () => {
        const doc = parseDocLang(wrap(`<text><${tag}>formatted</${tag}></text>`));
        const t = doc.children[0] as any;
        expect(t.children[0]).toEqual({
          type: "formatting",
          tag,
          children: [{ type: "content", text: "formatted" }],
        });
      });
    }

    it("parses nested formatting", () => {
      const doc = parseDocLang(wrap(`<text><bold><italic>nested</italic></bold></text>`));
      const t = doc.children[0] as any;
      expect(t.children[0].tag).toBe("bold");
      expect(t.children[0].children[0].tag).toBe("italic");
    });
  });

  describe("element head", () => {
    it("parses label", () => {
      const doc = parseDocLang(wrap(`<text><label value="intro"/>Intro text</text>`));
      const t = doc.children[0] as any;
      expect(t.head.label).toBe("intro");
    });

    it("parses thread", () => {
      const doc = parseDocLang(wrap(`<text><thread thread_id="42"/>Text</text>`));
      const t = doc.children[0] as any;
      expect(t.head.threadId).toBe(42);
    });

    it("parses xref", () => {
      const doc = parseDocLang(wrap(`<text><xref thread_id="5"/>Text</text>`));
      const t = doc.children[0] as any;
      expect(t.head.xrefThreadId).toBe(5);
    });

    it("parses href", () => {
      const doc = parseDocLang(wrap(`<text><href uri="https://example.com"/>Text</text>`));
      const t = doc.children[0] as any;
      expect(t.head.hrefUri).toBe("https://example.com");
    });

    it("parses layer", () => {
      for (const val of ["body", "background", "furniture"]) {
        const doc = parseDocLang(wrap(`<text><layer value="${val}"/>Text</text>`));
        const t = doc.children[0] as any;
        expect(t.head.layer).toBe(val);
      }
    });

    it("parses location block (4 elements)", () => {
      const doc = parseDocLang(wrap(
        `<heading level="1"><location value="48"/><location value="40"/><location value="420"/><location value="72"/>Title</heading>`
      ));
      const h = doc.children[0] as any;
      expect(h.head.location).toEqual({
        x0: 48, y0: 40, x1: 420, y1: 72,
        x0Res: undefined, y0Res: undefined, x1Res: undefined, y1Res: undefined,
      });
    });

    it("parses location with resolution", () => {
      const doc = parseDocLang(wrap(
        `<text><location value="10" resolution="1024"/><location value="20" resolution="768"/><location value="500" resolution="1024"/><location value="600" resolution="768"/>Text</text>`
      ));
      const t = doc.children[0] as any;
      expect(t.head.location.x0Res).toBe(1024);
      expect(t.head.location.y0Res).toBe(768);
      expect(t.head.location.x1Res).toBe(1024);
      expect(t.head.location.y1Res).toBe(768);
    });

    it("parses caption in element head", () => {
      const doc = parseDocLang(wrap(
        `<picture><caption><content>A photo</content></caption><src uri="img.png"/></picture>`
      ));
      const p = doc.children[0] as any;
      expect(p.head.caption).toEqual([{ type: "content", text: "A photo" }]);
    });

    it("parses custom element", () => {
      const doc = parseDocLang(wrap(`<text><custom>{"key":"val"}</custom>Text</text>`));
      const t = doc.children[0] as any;
      expect(t.head.custom).toBeDefined();
    });

    it("returns undefined head when no properties present", () => {
      const doc = parseDocLang(wrap(`<text>Just text</text>`));
      expect((doc.children[0] as any).head).toBeUndefined();
    });
  });

  describe("list", () => {
    it("parses unordered list with ldiv items", () => {
      const doc = parseDocLang(wrap(
        `<list><ldiv/><content>Item 1</content><ldiv/><content>Item 2</content></list>`
      ));
      const list = doc.children[0] as any;
      expect(list.type).toBe("list");
      expect(list.listClass).toBe("unordered");
      expect(list.items).toHaveLength(2);
      expect(list.items[0].children[0].text).toBe("Item 1");
      expect(list.items[1].children[0].text).toBe("Item 2");
    });

    it("parses ordered list", () => {
      const doc = parseDocLang(wrap(
        `<list class="ordered"><ldiv/><content>A</content><ldiv/><content>B</content></list>`
      ));
      const list = doc.children[0] as any;
      expect(list.listClass).toBe("ordered");
    });

    it("parses list with formatting in items", () => {
      const doc = parseDocLang(wrap(
        `<list><ldiv/><bold>Bold item</bold></list>`
      ));
      const list = doc.children[0] as any;
      expect(list.items[0].children[0].tag).toBe("bold");
    });

    it("handles list with element head", () => {
      const doc = parseDocLang(wrap(
        `<list><label value="mylist"/><ldiv/><content>Item</content></list>`
      ));
      const list = doc.children[0] as any;
      expect(list.head.label).toBe("mylist");
    });
  });

  describe("table", () => {
    it("parses simple table with fcel and nl", () => {
      const doc = parseDocLang(wrap(
        `<table><fcel/>A<fcel/>B<nl/><fcel/>C<fcel/>D<nl/></table>`
      ));
      const table = doc.children[0] as any;
      expect(table.type).toBe("table");
      expect(table.grid.rows).toHaveLength(2);
      expect(table.grid.rows[0]).toHaveLength(2);
      expect(table.grid.rows[1]).toHaveLength(2);
    });

    it("parses table with column headers (ched)", () => {
      const doc = parseDocLang(wrap(
        `<table><ched/>Name<ched/>Value<nl/><fcel/>X<fcel/>42<nl/></table>`
      ));
      const table = doc.children[0] as any;
      expect(table.grid.rows[0][0].isHeader).toBe(true);
      expect(table.grid.rows[1][0].isHeader).toBe(false);
    });

    it("parses table with row headers (rhed)", () => {
      const doc = parseDocLang(wrap(
        `<table><rhed/>Row1<fcel/>Val1<nl/><rhed/>Row2<fcel/>Val2<nl/></table>`
      ));
      const table = doc.children[0] as any;
      expect(table.grid.rows[0][0].isHeader).toBe(true);
      expect(table.grid.rows[0][1].isHeader).toBe(false);
    });

    it("parses table with corner (corn)", () => {
      const doc = parseDocLang(wrap(
        `<table><corn/><ched/>Col1<nl/><rhed/>Row1<fcel/>Val<nl/></table>`
      ));
      const table = doc.children[0] as any;
      expect(table.grid.rows[0][0].isHeader).toBe(true);
    });

    it("parses table with colspan merge (lcel)", () => {
      const doc = parseDocLang(wrap(
        `<table><fcel/>Merged<lcel/><nl/></table>`
      ));
      const table = doc.children[0] as any;
      expect(table.grid.rows[0][0].colspan).toBe(2);
    });

    it("parses table with rowspan merge (ucel)", () => {
      const doc = parseDocLang(wrap(
        `<table><fcel/>Top<fcel/>B<nl/><ucel/><fcel/>D<nl/></table>`
      ));
      const table = doc.children[0] as any;
      expect(table.grid.rows[0][0].rowspan).toBe(2);
    });

    it("parses empty table", () => {
      const doc = parseDocLang(wrap(`<table></table>`));
      const table = doc.children[0] as any;
      expect(table.grid.rows).toHaveLength(0);
    });

    it("parses table with element head", () => {
      const doc = parseDocLang(wrap(
        `<table><label value="data-table"/><ched/>H<fcel/>V<nl/></table>`
      ));
      const table = doc.children[0] as any;
      expect(table.head.label).toBe("data-table");
    });
  });

  describe("picture", () => {
    it("parses picture with src child element", () => {
      const doc = parseDocLang(wrap(
        `<picture><src uri="image.png"/><content>A photo</content></picture>`
      ));
      const pic = doc.children[0] as any;
      expect(pic.type).toBe("picture");
      expect(pic.srcUri).toBe("image.png");
    });

    it("parses picture without src", () => {
      const doc = parseDocLang(wrap(`<picture><content>No image</content></picture>`));
      const pic = doc.children[0] as any;
      expect(pic.srcUri).toBeUndefined();
    });

    it("parses picture class attribute", () => {
      const doc = parseDocLang(wrap(`<picture class="chart"><src uri="chart.png"/></picture>`));
      const pic = doc.children[0] as any;
      expect(pic.pictureClass).toBe("chart");
    });

    it("parses picture with tabular", () => {
      const doc = parseDocLang(wrap(
        `<picture class="chart"><src uri="chart.png"/><tabular><ched/>X<ched/>Y<nl/><fcel/>1<fcel/>2<nl/></tabular></picture>`
      ));
      const pic = doc.children[0] as any;
      expect(pic.tabular).toBeDefined();
      expect(pic.tabular.rows).toHaveLength(2);
    });
  });

  describe("code", () => {
    it("parses code block", () => {
      const doc = parseDocLang(wrap(`<code>console.log("hello")</code>`));
      expect(doc.children[0].type).toBe("code");
      expect((doc.children[0] as any).children[0].text).toBe('console.log("hello")');
    });
  });

  describe("formula", () => {
    it("parses formula", () => {
      const doc = parseDocLang(wrap(`<formula>E = mc^2</formula>`));
      expect(doc.children[0].type).toBe("formula");
      expect((doc.children[0] as any).children[0].text).toBe("E = mc^2");
    });
  });

  describe("page_header / page_footer", () => {
    it("parses page_header", () => {
      const doc = parseDocLang(wrap(`<page_header>Header text</page_header>`));
      expect(doc.children[0].type).toBe("page_header");
    });

    it("parses page_footer", () => {
      const doc = parseDocLang(wrap(`<page_footer>Footer text</page_footer>`));
      expect(doc.children[0].type).toBe("page_footer");
    });
  });

  describe("footnote", () => {
    it("parses footnote", () => {
      const doc = parseDocLang(wrap(`<footnote><content>Source: report</content></footnote>`));
      expect(doc.children[0].type).toBe("footnote");
    });
  });

  describe("page_break", () => {
    it("parses page_break", () => {
      const doc = parseDocLang(wrap(`<page_break/>`));
      expect(doc.children[0]).toEqual({ type: "page_break" });
    });
  });

  describe("group", () => {
    it("parses group with children", () => {
      const doc = parseDocLang(wrap(`<group><text>A</text><text>B</text></group>`));
      const g = doc.children[0] as any;
      expect(g.type).toBe("group");
      expect(g.children).toHaveLength(2);
    });
  });

  describe("index", () => {
    it("parses index with OTSL tokens", () => {
      const doc = parseDocLang(wrap(`<index><fcel/>Entry<fcel/>Page<nl/></index>`));
      const idx = doc.children[0] as any;
      expect(idx.type).toBe("index");
      expect(idx.grid.rows).toHaveLength(1);
    });
  });

  describe("form elements", () => {
    it("parses field_region", () => {
      const doc = parseDocLang(wrap(`<field_region><text>Form content</text></field_region>`));
      expect(doc.children[0].type).toBe("field_region");
    });

    it("parses field_heading with level", () => {
      const doc = parseDocLang(wrap(`<field_heading level="2">Section</field_heading>`));
      const fh = doc.children[0] as any;
      expect(fh.type).toBe("field_heading");
      expect(fh.level).toBe(2);
    });

    it("parses field_item", () => {
      const doc = parseDocLang(wrap(`<field_item><key>Name</key><value>John</value></field_item>`));
      const fi = doc.children[0] as any;
      expect(fi.type).toBe("field_item");
      expect(fi.children).toHaveLength(2);
    });

    it("parses key", () => {
      const doc = parseDocLang(wrap(`<key><content>Label</content></key>`));
      expect(doc.children[0].type).toBe("key");
    });

    it("parses value read_only", () => {
      const doc = parseDocLang(wrap(`<value><content>John</content></value>`));
      const v = doc.children[0] as any;
      expect(v.type).toBe("value");
      expect(v.valueClass).toBe("read_only");
    });

    it("parses value fillable", () => {
      const doc = parseDocLang(wrap(`<value class="fillable"><content>Enter name</content></value>`));
      const v = doc.children[0] as any;
      expect(v.valueClass).toBe("fillable");
    });
  });

  describe("marker and checkbox", () => {
    it("parses marker with selected checkbox", () => {
      const doc = parseDocLang(wrap(`<text><marker><checkbox class="selected"/><content>Done</content></marker></text>`));
      const t = doc.children[0] as any;
      expect(t.children[0].type).toBe("marker");
      expect(t.children[0].checkbox).toBe("selected");
    });

    it("parses marker with unselected checkbox", () => {
      const doc = parseDocLang(wrap(`<text><marker><checkbox class="unselected"/><content>Todo</content></marker></text>`));
      const t = doc.children[0] as any;
      expect(t.children[0].type).toBe("marker");
      expect(t.children[0].checkbox).toBe("unselected");
    });

    it("parses marker without checkbox", () => {
      const doc = parseDocLang(wrap(`<text><marker><content>Just marked</content></marker></text>`));
      const t = doc.children[0] as any;
      expect(t.children[0].type).toBe("marker");
      expect(t.children[0].checkbox).toBeUndefined();
    });
  });

  describe("complex document", () => {
    it("parses a full document with mixed elements", () => {
      const xml = wrap(`
        <head><default_resolution width="1024" height="768"/></head>
        <heading level="1">
          <location value="48"/><location value="40"/><location value="420"/><location value="72"/>
          Q3 Financial Summary
        </heading>
        <text>
          <label value="intro"/>
          The quarterly results are in.
        </text>
        <table>
          <ched/>Quarter<ched/>Revenue<ched/>YoY<nl/>
          <fcel/>Q3 2024<fcel/>$42M<fcel/>+18%<nl/>
        </table>
        <list class="unordered">
          <ldiv/><content>Item 1</content>
          <ldiv/><content>Item 2</content>
        </list>
        <picture>
          <src uri="chart.png"/>
          <content>Revenue chart</content>
        </picture>
        <page_break/>
        <code>console.log("hello")</code>
        <formula>E = mc^2</formula>
        <footnote>
          <content>Source: annual report</content>
        </footnote>
      `);

      const doc = parseDocLang(xml);

      expect(doc.version).toBe("0.6");
      expect(doc.defaultResolution).toEqual({ width: 1024, height: 768 });
      expect(doc.children).toHaveLength(9);

      const heading = doc.children[0] as any;
      expect(heading.type).toBe("heading");
      expect(heading.level).toBe(1);
      expect(heading.head.location).toBeDefined();
      expect(heading.head.location.x0).toBe(48);

      const text = doc.children[1] as any;
      expect(text.type).toBe("text");
      expect(text.head.label).toBe("intro");

      const table = doc.children[2] as any;
      expect(table.type).toBe("table");
      expect(table.grid.rows[0][0].isHeader).toBe(true);
      expect(table.grid.rows[1][0].isHeader).toBe(false);

      const list = doc.children[3] as any;
      expect(list.type).toBe("list");
      expect(list.listClass).toBe("unordered");
      expect(list.items).toHaveLength(2);

      const picture = doc.children[4] as any;
      expect(picture.type).toBe("picture");
      expect(picture.srcUri).toBe("chart.png");

      expect(doc.children[5]).toEqual({ type: "page_break" });

      expect(doc.children[6].type).toBe("code");
      expect(doc.children[7].type).toBe("formula");
      expect(doc.children[8].type).toBe("footnote");
    });

    it("parses real DocLang example from official repo", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<doclang>
  <picture>
    <label value="flow_chart"/>
    <location value="102"/><location value="85"/><location value="416"/><location value="160"/>
    <caption>Fig. 3. OTSL description of table structure</caption>
  </picture>

  <table>
    <location value="63"/><location value="78"/><location value="436"/><location value="158"/>
    <caption>Table 2. ISR and cell detection results</caption>
    <ched/>Data set <ched/>Lang<ched/>TEDs  <lcel/>       <lcel/>     <ched/>mAP (0.75)<ched/>Inference time (secs)<nl/>
    <ucel/>         <ucel/>    <ched/>simple<ched/>complex<ched/>all  <ucel/>          <ucel/>                     <nl/>
    <rhed/>PubTabNet<rhed/>OTSL<fcel/>0.965 <fcel/>0.934  <fcel/>0.955<fcel/>0.88      <fcel/>2.73                 <nl/>
  </table>

  <heading level="2"><location value="58"/><location value="343"/><location value="209"/><location value="351"/>
    5.2 Quantitative Results</heading>

  <text><location value="66"/><location value="360"/><location value="358"/><location value="368"/>The OTSL uses tokens:</text>

  <list>
    <ldiv/><location value="53"/><location value="377"/><location value="439"/><location value="385"/>"C" cell content
    <ldiv/><location value="53"/><location value="387"/><location value="439"/><location value="403"/>"L" cell content
    <ldiv/><location value="53"/><location value="405"/><location value="439"/><location value="421"/>"U" cell content
  </list>

  <code>
    <label value="R"/>
    <location value="58"/><location value="170"/><location value="443"/><location value="266"/>
    <content><![CDATA[require(plyr)]]></content>
  </code>
</doclang>`;

      const doc = parseDocLang(xml);

      expect(doc.children).toHaveLength(6);

      const picture = doc.children[0] as any;
      expect(picture.type).toBe("picture");
      expect(picture.head.label).toBe("flow_chart");
      expect(picture.head.location.x0).toBe(102);
      expect(picture.head.location.y0).toBe(85);

      const table = doc.children[1] as any;
      expect(table.type).toBe("table");
      expect(table.head.location.x0).toBe(63);
      expect(table.head.caption).toBeDefined();
      expect(table.grid.rows.length).toBeGreaterThanOrEqual(2);

      const heading = doc.children[2] as any;
      expect(heading.type).toBe("heading");
      expect(heading.level).toBe(2);
      expect(heading.head.location).toBeDefined();
      const headingText = heading.children.map((c: any) => c.text || "").join("").trim();
      expect(headingText).toContain("5.2 Quantitative Results");

      const text = doc.children[3] as any;
      expect(text.type).toBe("text");
      expect(text.head.location.x0).toBe(66);
      const textContent = text.children.map((c: any) => c.text || "").join("");
      expect(textContent).toContain("OTSL uses tokens");

      const list = doc.children[4] as any;
      expect(list.type).toBe("list");
      expect(list.items).toHaveLength(3);
      expect(list.items[0].head).toBeDefined();
      expect(list.items[0].head.location.x0).toBe(53);
      expect(list.items[0].head.location.y0).toBe(377);
      expect(list.items[0].head.location.x1).toBe(439);
      expect(list.items[0].head.location.y1).toBe(385);

      const code = doc.children[5] as any;
      expect(code.type).toBe("code");
      expect(code.head.label).toBe("R");
      expect(code.head.location).toBeDefined();
    });

    it("property elements do not leak into inline content", () => {
      const doc = parseDocLang(wrap(
        `<text><label value="test"/><location value="1"/><location value="2"/><location value="3"/><location value="4"/>Actual text</text>`
      ));
      const t = doc.children[0] as any;
      expect(t.head.label).toBe("test");
      expect(t.head.location).toBeDefined();
      expect(t.children).toHaveLength(1);
      expect(t.children[0].text.trim()).toBe("Actual text");
    });

    it("list items collect their own element heads independently", () => {
      const doc = parseDocLang(wrap(
        `<list>
          <ldiv/><location value="10"/><location value="20"/><location value="30"/><location value="40"/>First item
          <ldiv/><location value="50"/><location value="60"/><location value="70"/><location value="80"/>Second item
        </list>`
      ));
      const list = doc.children[0] as any;
      expect(list.items).toHaveLength(2);
      expect(list.items[0].head.location.x0).toBe(10);
      expect(list.items[0].head.location.y0).toBe(20);
      expect(list.items[1].head.location.x0).toBe(50);
      expect(list.items[1].head.location.y0).toBe(60);
    });
  });
});
