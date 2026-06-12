import React, { useMemo, useEffect } from "react";
import { previewDocLang, getPreviewStyles } from "../core/index";
import type { VNode } from "../core/types";

export interface DocLangPreviewProps {
  /** DocLang XML string to render */
  xml: string;
  /** Additional CSS class name for the container */
  className?: string;
  /** Additional inline styles for the container */
  style?: React.CSSProperties;
  /** Whether to show bounding box overlays (default: false) */
  showBoundingBoxes?: boolean;
  /** Custom CSS to override default preview styles */
  customStyles?: string;
}

const STYLE_ID = "doclang-preview-css";

function vnodeToReact(vnode: VNode): React.ReactNode {
  const { tag, props, children } = vnode;

  const reactProps: Record<string, string | number | boolean | undefined> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) {
      continue;
    }
    if (key === "class") {
      reactProps.className = value;
    } else if (key === "for") {
      reactProps.htmlFor = value;
    } else {
      reactProps[key] = value;
    }
  }

  if (children.length === 0) {
    return React.createElement(tag, reactProps);
  }

  const reactChildren = children.map((child) => {
    if (typeof child === "string") {
      return child;
    }
    return vnodeToReact(child);
  });

  return React.createElement(tag, reactProps, ...reactChildren);
}

function useInjectPreviewCSS(): void {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const css = getPreviewStyles();
    const styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    styleEl.setAttribute("type", "text/css");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    return () => {
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);
}

export const DocLangPreview: React.FC<DocLangPreviewProps> = ({
  xml,
  className,
  style,
  showBoundingBoxes = false,
  customStyles,
}) => {
  useInjectPreviewCSS();

  const renderedChildren = useMemo(() => {
    if (!xml || xml.trim().length === 0) {
      return null;
    }

    try {
      const output = previewDocLang(xml);
      if (!output.vnodes || output.vnodes.length === 0) {
        return null;
      }
      return output.vnodes.map((vnode: VNode, index: number) => (
        <React.Fragment key={index}>{vnodeToReact(vnode)}</React.Fragment>
      ));
    } catch {
      return null;
    }
  }, [xml]);

  const containerClassName = [
    "doclang-preview",
    showBoundingBoxes ? "doclang-preview--show-bounding-boxes" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName} style={style}>
      {customStyles && (
        <style type="text/css" scoped>
          {customStyles}
        </style>
      )}
      {renderedChildren}
    </div>
  );
};

DocLangPreview.displayName = "DocLangPreview";
