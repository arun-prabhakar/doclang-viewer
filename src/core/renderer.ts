import type {
  DocLangDocument,
  VNode,
  RenderOutput,
  SemanticElement,
  InlineContent,
  FormattingNode,
  ContentNode,
  MarkerNode,
  HintNode,
  HeadingElement,
  TextElement,
  CodeElement,
  FormulaElement,
  PageHeaderElement,
  PageFooterElement,
  FootnoteElement,
  CaptionElement,
  PictureElement,
  ListElement,
  TableElement,
  IndexElement,
  GroupElement,
  FieldRegionElement,
  FieldHeadingElement,
  FieldItemElement,
  KeyElement,
  ValueElement,
  ElementHead,
  ResolvedTableCell,
} from "./types";
import { getPreviewStyles } from "./styles";

function v(tag: string, props: VNode["props"], children: VNode["children"]): VNode {
  return { tag, props, children };
}

function vText(text: string): string {
  return text;
}

function headProps(head: ElementHead | undefined): VNode["props"] {
  if (!head) return {};
  const props: VNode["props"] = {};
  if (head.label) props["data-dl-label"] = head.label;
  if (head.layer) props["data-dl-layer"] = head.layer;
  if (head.location) {
    props["data-dl-x0"] = head.location.x0;
    props["data-dl-y0"] = head.location.y0;
    props["data-dl-x1"] = head.location.x1;
    props["data-dl-y1"] = head.location.y1;
  }
  if (head.hrefUri) props["data-dl-href"] = head.hrefUri;
  if (head.threadId !== undefined) props["data-dl-thread"] = head.threadId;
  return props;
}

function renderInline(node: InlineContent): VNode | string {
  switch (node.type) {
    case "content":
      return vText(node.text);
    case "formatting":
      return renderFormatting(node);
    case "marker":
      return renderMarker(node);
    case "hint":
      return renderHint(node);
  }
}

function renderFormatting(node: FormattingNode): VNode {
  const tagMap: Record<string, string> = {
    bold: "strong",
    italic: "em",
    strikethrough: "del",
    underline: "u",
    superscript: "sup",
    subscript: "sub",
    rtl: "bdi",
    handwriting: "span",
  };
  const tag = tagMap[node.tag] ?? "span";
  const props: VNode["props"] = {};
  if (node.tag === "rtl") {
    props.dir = "rtl";
  }
  if (node.tag === "handwriting") {
    props.class = "dl-handwriting";
  }
  return v(tag, props, node.children.map(renderInline));
}

function renderMarker(node: MarkerNode): VNode {
  const children: (VNode | string)[] = [];
  if (node.checkbox) {
    children.push(
      v("input", {
        type: "checkbox",
        checked: node.checkbox === "selected",
        disabled: true,
        class: "dl-marker-checkbox",
      }, []),
    );
  }
  children.push(...node.children.map(renderInline));
  return v("span", { class: "dl-marker" }, children);
}

function renderHint(node: HintNode): VNode {
  return v("small", { class: "dl-hint" }, node.children.map(renderInline));
}

function renderInlineOrBlock(node: InlineContent | SemanticElement): VNode | string {
  if (
    node.type === "content" ||
    node.type === "formatting" ||
    node.type === "marker" ||
    node.type === "hint"
  ) {
    return renderInline(node as InlineContent);
  }
  return renderSemanticElement(node as SemanticElement);
}

function renderSemanticElement(el: SemanticElement): VNode {
  switch (el.type) {
    case "heading":
      return renderHeading(el);
    case "text":
      return renderText(el);
    case "code":
      return renderCode(el);
    case "formula":
      return renderFormula(el);
    case "page_header":
      return renderPageHeader(el);
    case "page_footer":
      return renderPageFooter(el);
    case "footnote":
      return renderFootnote(el);
    case "page_break":
      return renderPageBreak();
    case "caption":
      return renderCaption(el);
    case "picture":
      return renderPicture(el);
    case "list":
      return renderList(el);
    case "table":
      return renderTable(el);
    case "index":
      return renderIndex(el);
    case "group":
      return renderGroup(el);
    case "field_region":
      return renderFieldRegion(el);
    case "field_heading":
      return renderFieldHeading(el);
    case "field_item":
      return renderFieldItem(el);
    case "key":
      return renderKey(el);
    case "value":
      return renderValue(el);
  }
}

function renderHeading(el: HeadingElement): VNode {
  const level = Math.max(1, Math.min(6, el.level));
  const tag = `h${level}`;
  return v(tag, { ...headProps(el.head) }, el.children.map(renderInline));
}

function renderText(el: TextElement): VNode {
  return v("p", { ...headProps(el.head) }, el.children.map(renderInline));
}

function renderCode(el: CodeElement): VNode {
  const codeContent = el.children
    .map((c) => (c.type === "content" ? c.text : ""))
    .join("");
  return v("pre", { ...headProps(el.head) }, [v("code", {}, [vText(codeContent)])]);
}

function renderFormula(el: FormulaElement): VNode {
  return v("div", { ...headProps(el.head), class: "dl-formula" }, el.children.map(renderInline));
}

function renderPageHeader(el: PageHeaderElement): VNode {
  return v("header", { ...headProps(el.head), class: "dl-page-header" }, el.children.map(renderInline));
}

function renderPageFooter(el: PageFooterElement): VNode {
  return v("footer", { ...headProps(el.head), class: "dl-page-footer" }, el.children.map(renderInline));
}

function renderFootnote(el: FootnoteElement): VNode {
  return v("aside", { ...headProps(el.head), class: "dl-footnote" }, el.children.map(renderInline));
}

function renderPageBreak(): VNode {
  return v("hr", { class: "dl-page-break" }, []);
}

function renderCaption(el: CaptionElement): VNode {
  return v("figcaption", { ...headProps(el.head), class: "dl-caption" }, el.children.map(renderInline));
}

function renderPicture(el: PictureElement): VNode {
  const children: (VNode | string)[] = [];
  if (el.srcUri) {
    children.push(v("img", { src: el.srcUri, alt: "", class: "dl-picture-img" }, []));
  }
  const inlineChildren = el.children.map(renderInlineOrBlock);
  children.push(...inlineChildren);
  if (el.tabular) {
    children.push(renderTableGrid(el.tabular));
  }
  return v("figure", { ...headProps(el.head), class: "dl-picture" }, children);
}

function renderList(el: ListElement): VNode {
  const tag = el.listClass === "ordered" ? "ol" : "ul";
  const items = el.items.map((item) =>
    v("li", { ...headProps(item.head) }, item.children.map(renderInlineOrBlock)),
  );
  return v(tag, { ...headProps(el.head) }, items);
}

function renderTableCell(cell: ResolvedTableCell): VNode {
  const tag = cell.isHeader ? "th" : "td";
  const props: VNode["props"] = {
    ...headProps(cell.head),
  };
  if (cell.rowspan > 1) props.rowspan = cell.rowspan;
  if (cell.colspan > 1) props.colspan = cell.colspan;
  return v(tag, props, cell.content.map(renderInlineOrBlock));
}

function renderTableGrid(grid: import("./types").TableGrid): VNode {
  if (grid.rows.length === 0) {
    return v("table", { class: "dl-table" }, []);
  }

  const hasHeaders = grid.rows.some((row) => row.some((cell) => cell.isHeader));

  if (hasHeaders) {
    const headerRows = grid.rows.filter((row) => row.some((cell) => cell.isHeader));
    const bodyRows = grid.rows.filter((row) => !row.some((cell) => cell.isHeader));

    const children: VNode[] = [];
    if (headerRows.length > 0) {
      children.push(
        v(
          "thead",
          {},
          headerRows.map((row) => v("tr", {}, row.map(renderTableCell))),
        ),
      );
    }
    if (bodyRows.length > 0) {
      children.push(
        v(
          "tbody",
          {},
          bodyRows.map((row) => v("tr", {}, row.map(renderTableCell))),
        ),
      );
    }
    return v("table", { class: "dl-table" }, children);
  }

  return v(
    "table",
    { class: "dl-table" },
    [
      v(
        "tbody",
        {},
        grid.rows.map((row) => v("tr", {}, row.map(renderTableCell))),
      ),
    ],
  );
}

function renderTable(el: TableElement): VNode {
  const tableVNode = renderTableGrid(el.grid);
  return v("div", { ...headProps(el.head), class: "dl-table-wrapper" }, [tableVNode]);
}

function renderIndex(el: IndexElement): VNode {
  const tableVNode = renderTableGrid(el.grid);
  return v("div", { ...headProps(el.head), class: "dl-index" }, [tableVNode]);
}

function renderGroup(el: GroupElement): VNode {
  return v("div", { ...headProps(el.head), class: "dl-group" }, el.children.map(renderSemanticElement));
}

function renderFieldRegion(el: FieldRegionElement): VNode {
  return v("fieldset", { ...headProps(el.head), class: "dl-field-region" }, el.children.map(renderInlineOrBlock));
}

function renderFieldHeading(el: FieldHeadingElement): VNode {
  return v("legend", { ...headProps(el.head), class: "dl-field-heading" }, el.children.map(renderInlineOrBlock));
}

function renderFieldItem(el: FieldItemElement): VNode {
  return v("div", { ...headProps(el.head), class: "dl-field-item" }, el.children.map(renderInlineOrBlock));
}

function renderKey(el: KeyElement): VNode {
  return v("label", { ...headProps(el.head), class: "dl-key" }, el.children.map(renderInlineOrBlock));
}

function renderValue(el: ValueElement): VNode {
  if (el.valueClass === "fillable") {
    const textContent = el.children
      .filter((c): c is ContentNode => c.type === "content")
      .map((c) => c.text)
      .join("");
    return v("input", {
      ...headProps(el.head),
      type: "text",
      class: "dl-value dl-value-fillable",
      value: textContent,
      placeholder: textContent,
    }, []);
  }
  return v("span", { ...headProps(el.head), class: "dl-value dl-value-readonly" }, el.children.map(renderInlineOrBlock));
}

// ─── VNode → HTML Serialization ─────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function serializeVNode(node: VNode | string): string {
  if (typeof node === "string") {
    return escapeHtml(node);
  }

  const { tag, props, children } = node;

  let html = `<${tag}`;

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;
    if (typeof value === "boolean") {
      if (value) {
        html += ` ${escapeHtml(key)}`;
      }
    } else {
      html += ` ${escapeHtml(key)}="${escapeHtml(String(value))}"`;
    }
  }

  if (VOID_ELEMENTS.has(tag)) {
    html += " />";
    return html;
  }

  html += ">";

  for (const child of children) {
    html += serializeVNode(child);
  }

  html += `</${tag}>`;

  return html;
}

// ─── Public API ─────────────────────────────────────────────────

export function renderDocLangToVNodes(doc: DocLangDocument): VNode[] {
  const children: VNode[] = [];

  for (const el of doc.children) {
    children.push(renderSemanticElement(el));
  }

  return children;
}

export function renderDocLangToHTML(doc: DocLangDocument): string {
  const vnodes = renderDocLangToVNodes(doc);
  let html = '<div class="dl-document">\n';
  for (const vnode of vnodes) {
    html += serializeVNode(vnode) + "\n";
  }
  html += "</div>";
  return html;
}

export function renderDocLang(doc: DocLangDocument): RenderOutput {
  const vnodes = renderDocLangToVNodes(doc);
  const html = renderDocLangToHTML(doc);
  const css = getPreviewStyles();
  return { html, vnodes, css };
}
