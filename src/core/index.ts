export { DOCLANG_NS } from "./types";
export type {
  BoundingBox,
  ElementHead,
  FormattingTag,
  FormattingNode,
  ContentNode,
  MarkerNode,
  HintNode,
  InlineContent,
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
  ListItem,
  ListElement,
  OTSLTokenType,
  OTSLCell,
  ResolvedTableCell,
  ResolvedTableRow,
  TableGrid,
  TableElement,
  IndexElement,
  GroupElement,
  FieldRegionElement,
  FieldHeadingElement,
  FieldItemElement,
  KeyElement,
  ValueElement,
  SemanticElement,
  DocLangDocument,
  DocLangHead,
  VNode,
  RenderOutput,
  ParseDocLangFn,
  RenderDocLangFn,
  PreviewDocLangFn,
  GetPreviewStylesFn,
} from "./types";

export { parseDocLang } from "./parser";
export { renderDocLang, renderDocLangToHTML, renderDocLangToVNodes } from "./renderer";
export { PREVIEW_CSS } from "./styles";
export { buildOTSLGrid, parseRawTokens } from "./otsl";

import { parseDocLang } from "./parser";
import { renderDocLang } from "./renderer";
import { PREVIEW_CSS } from "./styles";
import type { RenderOutput } from "./types";

export function previewDocLang(xml: string): RenderOutput {
  const doc = parseDocLang(xml);
  return renderDocLang(doc);
}

export function getPreviewStyles(): string {
  return PREVIEW_CSS;
}
