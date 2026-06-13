import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { previewDocLang } from '../core/index';
import { RenderOutput } from '../core/types';

@Component({
  selector: 'doclang-viewer',
  standalone: true,
  template: `
    <div
      class="doclang-viewer"
      [innerHTML]="renderedHtml"
      [class.show-bounding-boxes]="showBoundingBoxes"
    ></div>
    <style [innerHTML]="styles"></style>
  `,
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocLangPreviewComponent implements OnChanges {
  @Input() xml = '';

  @Input() showBoundingBoxes = false;

  @Input() customStyles?: string;

  renderedHtml: SafeHtml = '';

  styles: SafeHtml = '';

  constructor(
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['xml'] || changes['customStyles'] || changes['showBoundingBoxes']) {
      this.render();
    }
  }

  private render(): void {
    if (!this.xml || this.xml.trim().length === 0) {
      this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(
        '<div class="doclang-viewer-empty"></div>',
      );
      this.styles = this.sanitizer.bypassSecurityTrustHtml(this.buildCssString(''));
      this.cdr.markForCheck();
      return;
    }

    let output: RenderOutput;

    try {
      output = previewDocLang(this.xml);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(
        `<div class="doclang-viewer-error">Failed to render DocLang: ${this.escapeHtml(message)}</div>`,
      );
      this.styles = this.sanitizer.bypassSecurityTrustHtml(this.buildCssString(''));
      this.cdr.markForCheck();
      return;
    }

    this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(output.html);
    this.styles = this.sanitizer.bypassSecurityTrustHtml(
      this.buildCssString(output.css),
    );
    this.cdr.markForCheck();
  }

  private buildCssString(previewCss: string): string {
    const parts: string[] = [];

    if (previewCss) {
      parts.push(previewCss);
    }

    if (this.showBoundingBoxes) {
      parts.push(`
        .doclang-viewer [data-bounding-box] {
          outline: 1px dashed rgba(255, 0, 0, 0.5);
          background-color: rgba(255, 0, 0, 0.05);
        }
      `);
    }

    if (this.customStyles) {
      parts.push(this.customStyles);
    }

    return parts.join('\n');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
