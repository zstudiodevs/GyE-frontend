import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'gye-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly _theme = signal<Theme>(this.resolveInitialTheme());

  /** Current theme as a read-only signal. */
  readonly theme = this._theme.asReadonly();

  /** Convenience boolean signal. */
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    // Apply the CSS class and persist preference whenever the signal changes.
    effect(() => {
      const dark = this.isDark();
      this.document.documentElement.classList.toggle('dark-theme', dark);
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this._theme.update(current => (current === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  private resolveInitialTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
