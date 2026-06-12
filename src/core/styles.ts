export const PREVIEW_CSS = `
.dl-document {
  max-width: 816px;
  margin: 0 auto;
  padding: 48px 60px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  font-family: Georgia, "Times New Roman", Times, serif;
  font-size: 14px;
  line-height: 1.65;
  color: #1a1a1a;
}

.dl-document h1,
.dl-document h2,
.dl-document h3,
.dl-document h4,
.dl-document h5,
.dl-document h6 {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  color: #111;
}

.dl-document h1 { font-size: 2em; }
.dl-document h2 { font-size: 1.6em; }
.dl-document h3 { font-size: 1.3em; }
.dl-document h4 { font-size: 1.1em; }
.dl-document h5 { font-size: 1em; }
.dl-document h6 { font-size: 0.9em; color: #555; }

.dl-document p {
  margin: 0 0 0.8em;
}

.dl-document pre {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 12px 16px;
  overflow-x: auto;
  margin: 0.8em 0;
  font-size: 0.9em;
}

.dl-document pre code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  background: none;
  border: none;
  padding: 0;
  font-size: inherit;
}

.dl-document .dl-formula {
  margin: 0.8em 0;
  padding: 12px 16px;
  background: #fafafa;
  border-left: 3px solid #ccc;
  font-style: italic;
  overflow-x: auto;
}

.dl-document .dl-page-header,
.dl-document .dl-page-footer {
  font-size: 0.85em;
  color: #888;
  text-align: center;
  padding: 8px 0;
}

.dl-document .dl-page-header {
  border-bottom: 1px solid #eee;
  margin-bottom: 1em;
}

.dl-document .dl-page-footer {
  border-top: 1px solid #eee;
  margin-top: 1em;
}

.dl-document .dl-footnote {
  font-size: 0.85em;
  color: #555;
  padding: 8px 12px;
  margin: 0.5em 0;
  background: #fafafa;
  border-left: 3px solid #ddd;
}

.dl-document .dl-page-break {
  border: none;
  border-top: 2px dashed #ccc;
  margin: 2em 0;
}

.dl-document .dl-picture {
  margin: 1em 0;
  text-align: center;
}

.dl-document .dl-picture-img {
  max-width: 100%;
  height: auto;
  border-radius: 2px;
}

.dl-document .dl-caption {
  font-size: 0.9em;
  color: #666;
  text-align: center;
  margin-top: 0.5em;
  font-style: italic;
}

.dl-document ol,
.dl-document ul {
  margin: 0.5em 0;
  padding-left: 2em;
}

.dl-document li {
  margin-bottom: 0.3em;
}

.dl-document ol ol,
.dl-document ul ul,
.dl-document ol ul,
.dl-document ul ol {
  margin-top: 0.3em;
  margin-bottom: 0.3em;
}

.dl-document .dl-table-wrapper {
  margin: 1em 0;
  overflow-x: auto;
}

.dl-document .dl-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.9em;
}

.dl-document .dl-table th,
.dl-document .dl-table td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
}

.dl-document .dl-table th {
  background: #f0f0f0;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #333;
}

.dl-document .dl-table tr:nth-child(even) td {
  background: #fafafa;
}

.dl-document .dl-index {
  margin: 1em 0;
  overflow-x: auto;
}

.dl-document .dl-group {
  margin: 0.5em 0;
  padding: 0.5em 0;
}

.dl-document .dl-field-region {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 16px;
  margin: 1em 0;
}

.dl-document .dl-field-heading {
  font-weight: 600;
  font-size: 1.05em;
  color: #333;
  padding: 0 4px;
}

.dl-document .dl-field-item {
  margin: 0.5em 0;
  padding: 4px 0;
}

.dl-document .dl-key {
  display: inline-block;
  font-weight: 500;
  color: #444;
  margin-right: 8px;
}

.dl-document .dl-value {
  display: inline;
}

.dl-document .dl-value-readonly {
  color: #1a1a1a;
}

.dl-document .dl-value-fillable {
  display: inline-block;
  border: none;
  border-bottom: 1px solid #ccc;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  color: #1a1a1a;
  padding: 2px 4px;
  min-width: 120px;
  outline: none;
  transition: border-color 0.2s;
}

.dl-document .dl-value-fillable:focus {
  border-bottom-color: #4a90d9;
}

.dl-document .dl-marker {
  display: inline;
}

.dl-document .dl-marker-checkbox {
  margin-right: 4px;
  vertical-align: middle;
  cursor: default;
}

.dl-document .dl-hint {
  display: block;
  font-size: 0.85em;
  color: #888;
  margin-top: 2px;
}

.dl-document .dl-handwriting {
  font-family: "Comic Sans MS", "Brush Script MT", cursive;
  font-style: italic;
}

.dl-document bdi[dir="rtl"] {
  direction: rtl;
  unicode-bidi: isolate;
}

.dl-document strong {
  font-weight: 700;
}

.dl-document em {
  font-style: italic;
}

.dl-document del {
  text-decoration: line-through;
  color: #888;
}

.dl-document u {
  text-decoration: underline;
}

.dl-document sup {
  font-size: 0.75em;
  vertical-align: super;
  line-height: 0;
}

.dl-document sub {
  font-size: 0.75em;
  vertical-align: sub;
  line-height: 0;
}

@media print {
  .dl-document {
    box-shadow: none;
    max-width: none;
    padding: 0;
    margin: 0;
  }

  .dl-document .dl-page-break {
    page-break-after: always;
    border: none;
    margin: 0;
    height: 0;
  }

  .dl-document .dl-value-fillable {
    border-bottom: 1px solid #999;
  }
}
`;

export function getPreviewStyles(): string {
  return PREVIEW_CSS;
}
