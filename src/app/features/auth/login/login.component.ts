import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="placeholder">Login — próximamente</p>`,
  styles: [`.placeholder { padding: 1.5rem; color: var(--mat-sys-on-surface-variant); }`],
})
export class LoginComponent {}
