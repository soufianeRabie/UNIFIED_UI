import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

type Lang = 'en' | 'fr';

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE']);

@Injectable({ providedIn: 'root' })
export class DomI18nService {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly translate = inject(TranslateService);
  private ready = false;
  private observer: MutationObserver | null = null;
  private maps: Record<Lang, Map<string, string>> = {
    en: new Map(),
    fr: new Map(),
  };

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
    const [en, fr] = await Promise.all([
      firstValueFrom(this.http.get<Record<string, unknown>>('/i18n/en.json')),
      firstValueFrom(this.http.get<Record<string, unknown>>('/i18n/fr.json')),
    ]);
    const flatEn = this.flatten(en);
    const flatFr = this.flatten(fr);
    Object.keys(flatEn).forEach((key) => {
      const ev = flatEn[key];
      const fv = flatFr[key];
      if (ev && fv && ev !== fv) {
        this.maps.fr.set(this.clean(ev), fv);
        this.maps.en.set(this.clean(fv), ev);
      }
    });
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
    const lang = (this.translate.currentLang()?.slice(0, 2) || 'fr') as Lang;
    const map = this.maps[lang];
    this.scanTextNodes(this.document.body, map);
    this.scanAttributes(this.document.body, map);
    this.document.documentElement.lang = lang;
  }

  private scanTextNodes(root: Node, map: Map<string, string>): void {
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
      const translated = map.get(this.clean(trimmed));
      if (!translated || translated === trimmed) return;
      const prefix = original.match(/^\s*/)?.[0] ?? '';
      const suffix = original.match(/\s*$/)?.[0] ?? '';
      node.textContent = `${prefix}${translated}${suffix}`;
    });
  }

  private scanAttributes(root: ParentNode, map: Map<string, string>): void {
    ATTRS.forEach((attr) => {
      root.querySelectorAll(`[${attr}]`).forEach((el) => {
        const raw = el.getAttribute(attr) ?? '';
        const translated = map.get(this.clean(raw));
        if (translated && translated !== raw) el.setAttribute(attr, translated);
      });
    });
  }

  private clean(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private isTranslatable(value: string): boolean {
    if (!value || value.length > 220) return false;
    if (!/[A-Za-zÀ-ÿ]/.test(value)) return false;
    if (/^[{}()[\]@#.:,;'"`+\-/*\\|<>=!?%0-9\s]+$/.test(value)) return false;
    return true;
  }
}
