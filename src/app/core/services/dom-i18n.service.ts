import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { I18N_ASSETS_PATH } from '../i18n/i18n.tokens';
import { LanguageCatalog } from '../i18n/language-catalog';

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE']);

/**
 * @deprecated Legacy safety net (removed in Phase 5): rewrites hard-coded DOM
 * text into the active language by matching it against every enabled
 * language file. Migrated screens use translation keys and never need it.
 */
@Injectable({ providedIn: 'root' })
export class DomI18nService {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);
  private readonly catalog = inject(LanguageCatalog);
  private readonly assetsPath = inject(I18N_ASSETS_PATH);
  private ready = false;
  private observer: MutationObserver | null = null;
  /** Any known text (in any language) → its translation key. */
  private readonly keyByText = new Map<string, string>();
  /** Language code → key → text. */
  private readonly textByLang = new Map<string, Record<string, string>>();

  async init(): Promise<void> {
    if (this.ready) return;
    await this.buildMaps();
    this.ready = true;
    this.scanSoon();
    this.translate.onLangChange.subscribe(() => this.scanSoon());
    this.observer = new MutationObserver(() => this.scanSoon());
    this.observer.observe(this.document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });
  }

  private scanTimer: number | null = null;

  private scanSoon(): void {
    if (this.scanTimer !== null) return;
    this.scanTimer = window.setTimeout(() => {
      this.scanTimer = null;
      this.scan();
    }, 30);
  }

  private async buildMaps(): Promise<void> {
    await this.catalog.load();
    const codes = this.catalog.enabled().map((l) => l.code);
    const files = await Promise.all(
      codes.map((code) =>
        firstValueFrom(this.http.get<Record<string, unknown>>(`${this.assetsPath}${code}.json`)).catch(() => ({})),
      ),
    );
    codes.forEach((code, i) => this.textByLang.set(code, this.flatten(files[i])));
    const tables = [...this.textByLang.values()];
    for (const key of Object.keys(tables[0] ?? {})) {
      const values = tables.map((t) => t[key]).filter((v): v is string => !!v);
      // Only texts that actually differ between languages need rewriting.
      if (new Set(values).size < 2) continue;
      for (const value of values) {
        const text = this.clean(value);
        if (!this.keyByText.has(text)) this.keyByText.set(text, key);
      }
    }
  }

  private flatten(value: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
    if (typeof value === 'string') {
      out[prefix] = value;
      return out;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return out;
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      this.flatten(child, prefix ? `${prefix}.${key}` : key, out);
    });
    return out;
  }

  private scan(): void {
    if (!this.ready) return;
    const table = this.textByLang.get(this.translate.currentLang() ?? '');
    if (!table) return;
    const translate = (text: string): string | undefined => {
      const key = this.keyByText.get(this.clean(text));
      return key ? table[key] : undefined;
    };
    this.scanTextNodes(this.document.body, translate);
    this.scanAttributes(this.document.body, translate);
  }

  private scanTextNodes(root: Node, translate: (text: string) => string | undefined): void {
    const walker = this.document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent || SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        const raw = node.textContent ?? '';
        const trimmed = raw.trim();
        if (!this.isTranslatable(trimmed)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    nodes.forEach((node) => {
      const original = node.textContent ?? '';
      const trimmed = original.trim();
      const translated = translate(trimmed);
      if (!translated || translated === trimmed) return;
      const prefix = original.match(/^\s*/)?.[0] ?? '';
      const suffix = original.match(/\s*$/)?.[0] ?? '';
      node.textContent = `${prefix}${translated}${suffix}`;
    });
  }

  private scanAttributes(root: ParentNode, translate: (text: string) => string | undefined): void {
    ATTRS.forEach((attr) => {
      root.querySelectorAll(`[${attr}]`).forEach((el) => {
        const raw = el.getAttribute(attr) ?? '';
        const translated = translate(raw);
        if (translated && translated !== raw) el.setAttribute(attr, translated);
      });
    });
  }

  private clean(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private isTranslatable(value: string): boolean {
    if (!value || value.length > 220) return false;
    if (!/\p{L}/u.test(value)) return false; // any script, incl. Arabic
    if (/^[{}()[\]@#.:,;'"`+\-/*\\|<>=!?%0-9\s]+$/.test(value)) return false;
    return true;
  }
}
