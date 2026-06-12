import { describe, it, expect } from "vitest";
import { parseDocLang } from "./parser";
import { renderDocLang, renderDocLangToHTML } from "./renderer";

const NS = `xmlns="https://www.doclang.ai/ns/v0"`;

describe("end-to-end: parse + render", () => {
  it("parses and renders a full DocLang document", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<doclang version="0.6" ${NS}>
  <head>
    <default_resolution width="1024" height="768"/>
  </head>
  <heading level="1">
    <location value="48"/><location value="40"/><location value="420"/><location value="72"/>
    Q3 Financial Summary
  </heading>
  <text>
    <label value="intro"/>
    The quarterly results are <bold>excellent</bold>.
  </text>
  <table>
    <ched/>Quarter<ched/>Revenue<ched/>YoY<nl/>
    <fcel/>Q3 2024<fcel/>$42M<fcel/>+18%<nl/>
    <fcel/>Q2 2024<fcel/>$39M<fcel/>+12%<nl/>
  </table>
  <list class="unordered">
    <ldiv/><content>Item 1</content>
    <ldiv/><bold>Item 2</bold>
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
</doclang>`;

    const doc = parseDocLang(xml);
    expect(doc.children).toHaveLength(9);

    const output = renderDocLang(doc);
    expect(output.html).toContain("<h1");
    expect(output.html).toContain("Q3 Financial Summary");
    expect(output.html).toContain("<strong>excellent</strong>");
    expect(output.html).toContain("<table");
    expect(output.html).toContain("<ul>");
    expect(output.html).toContain("<figure");
    expect(output.html).toContain('src="chart.png"');
    expect(output.html).toContain("dl-page-break");
    expect(output.html).toContain("<pre>");
    expect(output.html).toContain("<code>");
    expect(output.html).toContain("dl-formula");
    expect(output.html).toContain("dl-footnote");
    expect(output.css).toContain(".dl-document");
  });

  it("renders table with proper thead/tbody from OTSL", () => {
    const xml = `<?xml version="1.0"?>
<doclang ${NS}>
  <table>
    <ched/>Name<ched/>Value<nl/>
    <fcel/>X<fcel/>42<nl/>
    <fcel/>Y<fcel/>99<nl/>
  </table>
</doclang>`;

    const doc = parseDocLang(xml);
    const html = renderDocLangToHTML(doc);

    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("<th");
    expect(html).toContain("<td");
  });

  it("renders table with colspan merge", () => {
    const xml = `<?xml version="1.0"?>
<doclang ${NS}>
  <table>
    <fcel/>Wide<lcel/><nl/>
  </table>
</doclang>`;

    const doc = parseDocLang(xml);
    const html = renderDocLangToHTML(doc);
    expect(html).toContain('colspan="2"');
  });

  it("renders location data attributes", () => {
    const xml = `<?xml version="1.0"?>
<doclang ${NS}>
  <heading level="1">
    <location value="10"/><location value="20"/><location value="300"/><location value="60"/>
    Title
  </heading>
</doclang>`;

    const doc = parseDocLang(xml);
    const html = renderDocLangToHTML(doc);
    expect(html).toContain('data-dl-x0="10"');
    expect(html).toContain('data-dl-y0="20"');
    expect(html).toContain('data-dl-x1="300"');
    expect(html).toContain('data-dl-y1="60"');
  });

  it("renders form elements", () => {
    const xml = `<?xml version="1.0"?>
<doclang ${NS}>
  <field_region>
    <field_heading level="1">Personal Info</field_heading>
    <field_item>
      <key><content>Name</content></key>
      <value class="fillable"><content>Enter name</content></value>
    </field_item>
  </field_region>
</doclang>`;

    const doc = parseDocLang(xml);
    const html = renderDocLangToHTML(doc);

    expect(html).toContain("fieldset");
    expect(html).toContain("legend");
    expect(html).toContain("<label");
    expect(html).toContain("input");
    expect(html).toContain("fillable");
  });

  it("handles prefixed namespace dl:", () => {
    const xml = `<?xml version="1.0"?>
<dl:doclang xmlns:dl="https://www.doclang.ai/ns/v0" version="0.6">
  <dl:heading level="2">Title</dl:heading>
  <dl:text>Body text</dl:text>
</dl:doclang>`;

    const doc = parseDocLang(xml);
    expect(doc.children).toHaveLength(2);
    expect(doc.children[0].type).toBe("heading");
    expect(doc.children[1].type).toBe("text");

    const html = renderDocLangToHTML(doc);
    expect(html).toContain("<h2>");
    expect(html).toContain("<p>");
  });
});
