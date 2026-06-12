import type {
  DocLangDocument,
  DocLangHead,
  ElementHead,
  BoundingBox,
  InlineContent,
  FormattingTag,
  MarkerNode,
  SemanticElement,
  HeadingElement,
  TextElement,
  CodeElement,
  FormulaElement,
  PageHeaderElement,
  PageFooterElement,
  FootnoteElement,
  PageBreakElement,
  CaptionElement,
  PictureElement,
  ListElement,
  ListItem,
  TableElement,
  IndexElement,
  TableGrid,
  OTSLCell,
  OTSLTokenType,
  GroupElement,
  FieldRegionElement,
  FieldHeadingElement,
  FieldItemElement,
  KeyElement,
  ValueElement,
} from "./types";
import { DOCLANG_NS } from "./types";
import { parseRawTokens } from "./otsl";

const PROPERTY_ELEMENT_NAMES = new Set([
  "label", "thread", "xref", "href", "layer", "location", "caption", "custom",
]);

const FORMATTING_MAP: Record<string, FormattingTag> = {
  bold: "bold",
  italic: "italic",
  strikethrough: "strikethrough",
  underline: "underline",
  superscript: "superscript",
  subscript: "subscript",
  rtl: "rtl",
  handwriting: "handwriting",
};

const OTSL_TOKENS = new Set<string>([
  "fcel", "ecel", "ched", "rhed", "corn", "srow", "lcel", "ucel", "xcel", "nl",
]);

const SEMANTIC_ELEMENT_NAMES = new Set([
  "heading", "text", "code", "formula", "page_header", "page_footer", "footnote",
  "page_break", "picture", "list", "table", "index", "group",
  "field_region", "field_heading", "field_item", "key", "value", "caption",
]);

function ln(el: Element): string {
  const tag = el.tagName;
  const idx = tag.indexOf(":");
  return idx >= 0 ? tag.substring(idx + 1) : tag;
}

function attr(el: Element, name: string): string | undefined {
  const v = el.getAttribute(name);
  return v !== null && v !== "" ? v : undefined;
}

function attrAny(el: Element, name: string): string | undefined {
  return attr(el, name) ?? attrNS(el, name);
}

function attrNS(el: Element, name: string): string | undefined {
  const v = el.getAttributeNS(DOCLANG_NS, name);
  return v !== null && v !== "" ? v : undefined;
}

function intVal(v: string | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = parseInt(v, 10);
  return isNaN(n) ? undefined : n;
}

function isDocLangElement(el: Element): boolean {
  const name = ln(el);
  if (el.namespaceURI === DOCLANG_NS) return true;
  if (SEMANTIC_ELEMENT_NAMES.has(name)) return true;
  if (PROPERTY_ELEMENT_NAMES.has(name)) return true;
  if (FORMATTING_MAP[name]) return true;
  if (OTSL_TOKENS.has(name)) return true;
  if (name === "content" || name === "marker" || name === "hint" || name === "checkbox" || name === "src" || name === "tabular" || name === "ldiv" || name === "head" || name === "default_resolution" || name === "meta" || name === "page_break") return true;
  return false;
}

function childElements(parent: Element): Element[] {
  const result: Element[] = [];
  for (let i = 0; i < parent.children.length; i++) {
    result.push(parent.children[i]);
  }
  return result;
}

function directChildrenNamed(parent: Element, name: string): Element[] {
  return childElements(parent).filter((c) => ln(c) === name);
}

function firstChildNamed(parent: Element, name: string): Element | undefined {
  for (const c of childElements(parent)) {
    if (ln(c) === name) return c;
  }
  return undefined;
}

function parseLocationBlock(parent: Element): BoundingBox | undefined {
  const locs = directChildrenNamed(parent, "location");
  if (locs.length < 4) return undefined;
  return {
    x0: intVal(attrAny(locs[0], "value")) ?? 0,
    y0: intVal(attrAny(locs[1], "value")) ?? 0,
    x1: intVal(attrAny(locs[2], "value")) ?? 0,
    y1: intVal(attrAny(locs[3], "value")) ?? 0,
    x0Res: intVal(attrAny(locs[0], "resolution")),
    y0Res: intVal(attrAny(locs[1], "resolution")),
    x1Res: intVal(attrAny(locs[2], "resolution")),
    y1Res: intVal(attrAny(locs[3], "resolution")),
  };
}

function parseElementHead(parent: Element): ElementHead | undefined {
  const head: ElementHead = {};

  const labelEl = firstChildNamed(parent, "label");
  if (labelEl) head.label = attrAny(labelEl, "value") ?? "undefined";

  const threadEl = firstChildNamed(parent, "thread");
  if (threadEl) head.threadId = intVal(attrAny(threadEl, "thread_id"));

  const xrefEl = firstChildNamed(parent, "xref");
  if (xrefEl) head.xrefThreadId = intVal(attrAny(xrefEl, "thread_id"));

  const hrefEl = firstChildNamed(parent, "href");
  if (hrefEl) head.hrefUri = attrAny(hrefEl, "uri");

  const layerEl = firstChildNamed(parent, "layer");
  if (layerEl) {
    const v = attrAny(layerEl, "value");
    if (v === "body" || v === "background" || v === "furniture") head.layer = v;
  }

  const loc = parseLocationBlock(parent);
  if (loc) head.location = loc;

  const captionEl = firstChildNamed(parent, "caption");
  if (captionEl) head.caption = parseInlineContent(captionEl);

  const customEl = firstChildNamed(parent, "custom");
  if (customEl) head.custom = customEl.innerHTML || customEl.textContent || undefined;

  if (!head.label && head.threadId === undefined && head.xrefThreadId === undefined &&
      !head.hrefUri && !head.layer && !head.location && !head.caption && !head.custom) {
    return undefined;
  }
  return head;
}

function isPropertyElement(el: Element): boolean {
  return PROPERTY_ELEMENT_NAMES.has(ln(el));
}

function parseInlineContent(parent: Element): InlineContent[] {
  const result: InlineContent[] = [];
  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.length > 0) result.push({ type: "content", text });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const name = ln(el);
      // Skip element head property elements — they're consumed by parseElementHead
      if (isPropertyElement(el)) continue;
      // Skip structural elements consumed elsewhere
      if (name === "src" || name === "tabular" || name === "checkbox") continue;
      const parsed = parseInlineNode(el);
      if (parsed) result.push(parsed);
    }
  }
  return result;
}

function parseInlineNode(el: Element): InlineContent | undefined {
  const name = ln(el);

  if (FORMATTING_MAP[name]) {
    return {
      type: "formatting",
      tag: FORMATTING_MAP[name],
      children: parseInlineContent(el),
    };
  }

  if (name === "content") {
    return { type: "content", text: el.textContent ?? "" };
  }

  if (name === "hint") {
    return { type: "hint", children: parseInlineContent(el) };
  }

  if (name === "marker") {
    const marker: MarkerNode = { type: "marker", children: [] };
    const head = parseElementHead(el);
    if (head) marker.head = head;

    for (const child of childElements(el)) {
      const childName = ln(child);
      if (childName === "checkbox") {
        const cls = attrAny(child, "class") ?? "unselected";
        marker.checkbox = cls === "selected" ? "selected" : "unselected";
      } else if (childName === "label" || childName === "thread" || childName === "xref" ||
                 childName === "href" || childName === "layer" || childName === "location" ||
                 childName === "caption" || childName === "custom") {
        // already handled by parseElementHead
      } else if (FORMATTING_MAP[childName] || childName === "content" || childName === "hint" || childName === "marker") {
        const parsed = parseInlineNode(child);
        if (parsed) marker.children.push(parsed);
      }
    }
    // also get text nodes
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent ?? "";
        if (text.length > 0) marker.children.push({ type: "content", text });
      }
    }
    return marker;
  }

  if (name === "checkbox") {
    // standalone checkbox outside marker — skip, handled by parent
    return undefined;
  }

  return undefined;
}

function parseInlineOrBlock(parent: Element): (InlineContent | SemanticElement)[] {
  const result: (InlineContent | SemanticElement)[] = [];
  for (const node of Array.from(parent.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.length > 0) result.push({ type: "content", text });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const name = ln(el);
      if (isPropertyElement(el)) continue;
      if (name === "src" || name === "tabular" || name === "checkbox") continue;
      if (SEMANTIC_ELEMENT_NAMES.has(name) && name !== "caption") {
        const block = parseSemanticElement(el);
        if (block) result.push(block);
      } else {
        const inline = parseInlineNode(el);
        if (inline) result.push(inline);
      }
    }
  }
  return result;
}

function parseSemanticChildren(parent: Element): SemanticElement[] {
  const result: SemanticElement[] = [];
  for (const child of childElements(parent)) {
    const parsed = parseSemanticElement(child);
    if (parsed) result.push(parsed);
  }
  return result;
}

function parseOTSLTable(tableEl: Element): TableGrid {
  const tokenSequence: { token: OTSLTokenType; content: (InlineContent | SemanticElement)[] }[] = [];

  let currentToken: OTSLTokenType | null = null;
  let currentContent: (InlineContent | SemanticElement)[] = [];

  const flush = () => {
    if (currentToken !== null) {
      tokenSequence.push({ token: currentToken, content: currentContent });
      currentToken = null;
      currentContent = [];
    }
  };

  for (const node of Array.from(tableEl.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const name = ln(el);

      if (OTSL_TOKENS.has(name)) {
        flush();
        currentToken = name as OTSLTokenType;
        currentContent = [];
      } else if (isPropertyElement(el)) {
        // skip element_head properties inside table cells
        continue;
      } else if (SEMANTIC_ELEMENT_NAMES.has(name) && name !== "caption") {
        const block = parseSemanticElement(el);
        if (block) currentContent.push(block);
      } else {
        const inline = parseInlineNode(el);
        if (inline) currentContent.push(inline);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.length > 0 && currentToken !== null) {
        currentContent.push({ type: "content", text });
      }
    }
  }
  flush();

  return parseRawTokens(tokenSequence);
}

function collectElementHeadProps(elements: Element[]): ElementHead | undefined {
  const head: ElementHead = {};
  for (const el of elements) {
    const name = ln(el);
    if (name === "label") head.label = attrAny(el, "value") ?? "undefined";
    else if (name === "thread") head.threadId = intVal(attrAny(el, "thread_id"));
    else if (name === "xref") head.xrefThreadId = intVal(attrAny(el, "thread_id"));
    else if (name === "href") head.hrefUri = attrAny(el, "uri");
    else if (name === "layer") {
      const v = attrAny(el, "value");
      if (v === "body" || v === "background" || v === "furniture") head.layer = v;
    } else if (name === "location") {
      if (!head.location) head.location = { x0: 0, y0: 0, x1: 0, y1: 0 };
      const locs = head.location;
      const val = intVal(attrAny(el, "value")) ?? 0;
      const res = intVal(attrAny(el, "resolution"));
      if (locs.x0 === 0 && locs.y0 === 0 && locs.x1 === 0 && locs.y1 === 0) {
        locs.x0 = val; locs.x0Res = res;
      } else if (locs.y0 === 0) {
        locs.y0 = val; locs.y0Res = res;
      } else if (locs.x1 === 0) {
        locs.x1 = val; locs.x1Res = res;
      } else {
        locs.y1 = val; locs.y1Res = res;
      }
    } else if (name === "caption") {
      head.caption = parseInlineContent(el);
    } else if (name === "custom") {
      head.custom = el.innerHTML || el.textContent || undefined;
    }
  }
  if (!head.label && head.threadId === undefined && head.xrefThreadId === undefined &&
      !head.hrefUri && !head.layer && !head.location && !head.caption && !head.custom) {
    return undefined;
  }
  return head;
}

function parseListItems(listEl: Element): ListItem[] {
  const items: ListItem[] = [];
  let currentItem: ListItem | null = null;
  let currentProps: Element[] = [];

  const pushItem = () => {
    if (currentItem) {
      if (!currentItem.head && currentProps.length > 0) {
        currentItem.head = collectElementHeadProps(currentProps);
      }
      items.push(currentItem);
    }
    currentItem = null;
    currentProps = [];
  };

  for (const node of Array.from(listEl.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const name = ln(el);

      if (name === "ldiv") {
        pushItem();
        currentItem = { children: [] };
        currentProps = [];
        continue;
      }

      if (!currentItem) continue;

      if (isPropertyElement(el)) {
        currentProps.push(el);
        continue;
      }

      if (!currentItem.head && currentProps.length > 0) {
        currentItem.head = collectElementHeadProps(currentProps);
        currentProps = [];
      }

      if (SEMANTIC_ELEMENT_NAMES.has(name) && name !== "caption") {
        const block = parseSemanticElement(el);
        if (block) currentItem.children.push(block);
      } else {
        const inline = parseInlineNode(el);
        if (inline) currentItem.children.push(inline);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.length > 0 && currentItem) {
        if (!currentItem.head && currentProps.length > 0) {
          currentItem.head = collectElementHeadProps(currentProps);
          currentProps = [];
        }
        currentItem.children.push({ type: "content", text });
      }
    }
  }
  pushItem();

  return items;
}

function parseSemanticElement(el: Element): SemanticElement | undefined {
  const name = ln(el);

  switch (name) {
    case "heading": {
      const level = intVal(attrAny(el, "level")) ?? 1;
      const heading: HeadingElement = {
        type: "heading",
        level: Math.max(1, Math.min(6, level)),
        head: parseElementHead(el),
        children: parseInlineContent(el),
      };
      return heading;
    }

    case "text": {
      return {
        type: "text",
        head: parseElementHead(el),
        children: parseInlineContent(el),
      } satisfies TextElement;
    }

    case "code": {
      return {
        type: "code",
        head: parseElementHead(el),
        children: parseInlineContent(el),
      } satisfies CodeElement;
    }

    case "formula": {
      return {
        type: "formula",
        head: parseElementHead(el),
        children: parseInlineContent(el),
      } satisfies FormulaElement;
    }

    case "page_header": {
      return {
        type: "page_header",
        head: parseElementHead(el),
        children: parseInlineContent(el),
      } satisfies PageHeaderElement;
    }

    case "page_footer": {
      return {
        type: "page_footer",
        head: parseElementHead(el),
        children: parseInlineContent(el),
      } satisfies PageFooterElement;
    }

    case "footnote": {
      return {
        type: "footnote",
        head: parseElementHead(el),
        children: parseInlineContent(el),
      } satisfies FootnoteElement;
    }

    case "page_break": {
      return { type: "page_break" } as PageBreakElement;
    }

    case "caption": {
      return {
        type: "caption",
        head: parseElementHead(el),
        children: parseInlineContent(el),
      } satisfies CaptionElement;
    }

    case "picture": {
      const pic: PictureElement = {
        type: "picture",
        pictureClass: (attrAny(el, "class") as PictureElement["pictureClass"]) ?? "undefined",
        children: [],
      };
      pic.head = parseElementHead(el);

      const srcEl = firstChildNamed(el, "src");
      if (srcEl) pic.srcUri = attrAny(srcEl, "uri");

      const tabularEl = firstChildNamed(el, "tabular");
      if (tabularEl) pic.tabular = parseOTSLTable(tabularEl);

      pic.children = parseInlineOrBlock(el);
      return pic;
    }

    case "list": {
      const listClass = attrAny(el, "class");
      const list: ListElement = {
        type: "list",
        listClass: listClass === "ordered" ? "ordered" : "unordered",
        head: parseElementHead(el),
        items: parseListItems(el),
      };

      if (list.items.length === 0) {
        // If no ldiv items, treat all non-head children as a single item
        const content = parseInlineOrBlock(el);
        if (content.length > 0) {
          list.items.push({ children: content });
        }
      }
      return list;
    }

    case "table": {
      return {
        type: "table",
        head: parseElementHead(el),
        grid: parseOTSLTable(el),
      } satisfies TableElement;
    }

    case "index": {
      return {
        type: "index",
        head: parseElementHead(el),
        grid: parseOTSLTable(el),
      } satisfies IndexElement;
    }

    case "group": {
      return {
        type: "group",
        head: parseElementHead(el),
        children: parseSemanticChildren(el),
      } satisfies GroupElement;
    }

    case "field_region": {
      return {
        type: "field_region",
        head: parseElementHead(el),
        children: parseInlineOrBlock(el),
      } satisfies FieldRegionElement;
    }

    case "field_heading": {
      return {
        type: "field_heading",
        level: intVal(attrAny(el, "level")) ?? 1,
        head: parseElementHead(el),
        children: parseInlineOrBlock(el),
      } satisfies FieldHeadingElement;
    }

    case "field_item": {
      return {
        type: "field_item",
        head: parseElementHead(el),
        children: parseInlineOrBlock(el),
      } satisfies FieldItemElement;
    }

    case "key": {
      return {
        type: "key",
        head: parseElementHead(el),
        children: parseInlineOrBlock(el),
      } satisfies KeyElement;
    }

    case "value": {
      const cls = attrAny(el, "class");
      return {
        type: "value",
        valueClass: cls === "fillable" ? "fillable" : "read_only",
        head: parseElementHead(el),
        children: parseInlineOrBlock(el),
      } satisfies ValueElement;
    }

    default:
      return undefined;
  }
}

function parseHead(headEl: Element): DocLangHead {
  const result: DocLangHead = {};
  const resEl = firstChildNamed(headEl, "default_resolution");
  if (resEl) {
    const w = intVal(attrAny(resEl, "width"));
    const h = intVal(attrAny(resEl, "height"));
    if (w !== undefined && h !== undefined) {
      result.defaultResolution = { width: w, height: h };
    }
  }
  return result;
}

export function parseDocLang(xml: string): DocLangDocument {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`DocLang XML parse error: ${parseError.textContent}`);
  }

  const root = doc.documentElement;
  if (!root) {
    throw new Error("DocLang XML: no root element found");
  }

  const rootName = ln(root);
  if (rootName !== "doclang" && rootName !== "document") {
    throw new Error(`DocLang XML: expected <doclang> root, got <${rootName}>`);
  }

  const version = attrAny(root, "version") ?? "0.6";
  const result: DocLangDocument = { version, children: [] };

  const headEl = firstChildNamed(root, "head");
  if (headEl) {
    result.head = parseHead(headEl);
    if (result.head?.defaultResolution) {
      result.defaultResolution = result.head.defaultResolution;
    }
  }

  result.children = parseSemanticChildren(root);
  return result;
}
