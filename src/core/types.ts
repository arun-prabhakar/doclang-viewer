/**
 * DocLang Preview — Type definitions
 *
 * These types model the DocLang XML specification (v0.6)
 * and define the public API surface for the preview library.
 */

// ─── DocLang Namespace ───────────────────────────────────────────

export const DOCLANG_NS = "https://www.doclang.ai/ns/v0";

// ─── Bounding Box ────────────────────────────────────────────────

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Per-coordinate resolution (pixel width/height of the coordinate space). */
  x0Res?: number;
  y0Res?: number;
  x1Res?: number;
  y1Res?: number;
}

// ─── Element Head (metadata attached to every semantic element) ──

export interface ElementHead {
  label?: string;
  threadId?: number;
  xrefThreadId?: number;
  hrefUri?: string;
  layer?: "body" | "background" | "furniture";
  location?: BoundingBox;
  caption?: InlineContent[];
  custom?: unknown;
}

// ─── Inline / Formatting Content ─────────────────────────────────

export type FormattingTag =
  | "bold"
  | "italic"
  | "strikethrough"
  | "underline"
  | "superscript"
  | "subscript"
  | "rtl"
  | "handwriting";

export interface FormattingNode {
  type: "formatting";
  tag: FormattingTag;
  children: InlineContent[];
}

export interface ContentNode {
  type: "content";
  text: string;
}

export interface MarkerNode {
  type: "marker";
  head?: ElementHead;
  children: InlineContent[];
  checkbox?: "selected" | "unselected";
}

export interface HintNode {
  type: "hint";
  children: InlineContent[];
}

/** Inline content that can appear inside text-bearing elements. */
export type InlineContent = FormattingNode | ContentNode | MarkerNode | HintNode;

// ─── Semantic Block Elements ─────────────────────────────────────

export interface HeadingElement {
  type: "heading";
  level: number;
  head?: ElementHead;
  children: InlineContent[];
}

export interface TextElement {
  type: "text";
  head?: ElementHead;
  children: InlineContent[];
}

export interface CodeElement {
  type: "code";
  head?: ElementHead;
  children: InlineContent[];
}

export interface FormulaElement {
  type: "formula";
  head?: ElementHead;
  children: InlineContent[];
}

export interface PageHeaderElement {
  type: "page_header";
  head?: ElementHead;
  children: InlineContent[];
}

export interface PageFooterElement {
  type: "page_footer";
  head?: ElementHead;
  children: InlineContent[];
}

export interface FootnoteElement {
  type: "footnote";
  head?: ElementHead;
  children: InlineContent[];
}

export interface PageBreakElement {
  type: "page_break";
}

export interface CaptionElement {
  type: "caption";
  head?: ElementHead;
  children: InlineContent[];
}

// ─── Picture ─────────────────────────────────────────────────────

export interface PictureElement {
  type: "picture";
  head?: ElementHead;
  srcUri?: string;
  pictureClass?: "undefined" | "chart";
  tabular?: TableGrid;
  children: (InlineContent | SemanticElement)[];
}

// ─── List ────────────────────────────────────────────────────────

export interface ListItem {
  head?: ElementHead;
  children: (InlineContent | SemanticElement)[];
}

export interface ListElement {
  type: "list";
  listClass: "ordered" | "unordered";
  head?: ElementHead;
  items: ListItem[];
}

// ─── Table (OTSL model) ──────────────────────────────────────────

/** The OTSL token types. */
export type OTSLTokenType =
  | "fcel"
  | "ecel"
  | "ched"
  | "rhed"
  | "corn"
  | "srow"
  | "lcel"
  | "ucel"
  | "xcel"
  | "nl";

/** A single OTSL cell position. */
export interface OTSLCell {
  token: Exclude<OTSLTokenType, "nl">;
  head?: ElementHead;
  content: (InlineContent | SemanticElement)[];
}

/** A resolved grid cell for rendering. */
export interface ResolvedTableCell {
  isHeader: boolean;
  rowspan: number;
  colspan: number;
  head?: ElementHead;
  content: (InlineContent | SemanticElement)[];
}

/** A row of resolved cells. */
export type ResolvedTableRow = ResolvedTableCell[];

/** A resolved OTSL grid. */
export interface TableGrid {
  rows: ResolvedTableRow[];
}

export interface TableElement {
  type: "table";
  head?: ElementHead;
  grid: TableGrid;
}

export interface IndexElement {
  type: "index";
  head?: ElementHead;
  grid: TableGrid;
}

// ─── Group ───────────────────────────────────────────────────────

export interface GroupElement {
  type: "group";
  head?: ElementHead;
  children: SemanticElement[];
}

// ─── Form / Field Elements ───────────────────────────────────────

export interface FieldRegionElement {
  type: "field_region";
  head?: ElementHead;
  children: (InlineContent | SemanticElement)[];
}

export interface FieldHeadingElement {
  type: "field_heading";
  level: number;
  head?: ElementHead;
  children: (InlineContent | SemanticElement)[];
}

export interface FieldItemElement {
  type: "field_item";
  head?: ElementHead;
  children: (InlineContent | SemanticElement)[];
}

export interface KeyElement {
  type: "key";
  head?: ElementHead;
  children: (InlineContent | SemanticElement)[];
}

export interface ValueElement {
  type: "value";
  valueClass: "read_only" | "fillable";
  head?: ElementHead;
  children: (InlineContent | SemanticElement)[];
}

// ─── Union Types ─────────────────────────────────────────────────

export type SemanticElement =
  | HeadingElement
  | TextElement
  | CodeElement
  | FormulaElement
  | PageHeaderElement
  | PageFooterElement
  | FootnoteElement
  | PageBreakElement
  | PictureElement
  | ListElement
  | TableElement
  | IndexElement
  | GroupElement
  | FieldRegionElement
  | FieldHeadingElement
  | FieldItemElement
  | KeyElement
  | ValueElement
  | CaptionElement;

// ─── Document Root ───────────────────────────────────────────────

export interface DocLangDocument {
  version: string;
  head?: DocLangHead;
  children: SemanticElement[];
  defaultResolution?: { width: number; height: number };
}

export interface DocLangHead {
  defaultResolution?: { width: number; height: number };
  custom?: unknown;
}

// ─── Virtual DOM (VNode) ─────────────────────────────────────────

export interface VNode {
  tag: string;
  props: Record<string, string | number | boolean | undefined>;
  children: (VNode | string)[];
}

// ─── Render Output ───────────────────────────────────────────────

export interface RenderOutput {
  /** HTML string of the rendered document. */
  html: string;
  /** VNode tree for framework-native rendering (React). */
  vnodes: VNode[];
  /** CSS string to inject for preview styling. */
  css: string;
}

// ─── Public API Surface ──────────────────────────────────────────

export type ParseDocLangFn = (xml: string) => DocLangDocument;
export type RenderDocLangFn = (doc: DocLangDocument) => RenderOutput;
export type PreviewDocLangFn = (xml: string) => RenderOutput;
export type GetPreviewStylesFn = () => string;
