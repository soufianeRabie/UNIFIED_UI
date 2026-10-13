import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  applyPrimary(color: string): void {
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', color);
    root.style.setProperty('--primary-color', color);
    root.style.setProperty('--p-primary-color', color);
  }

  applyBranding(brand: { primaryColor?: string }): void {
    if (brand.primaryColor) {
      this.applyPrimary(brand.primaryColor);
    }
  }
}
