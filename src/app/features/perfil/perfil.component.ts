import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-perfil',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="placeholder">Perfil — próximamente</p>`,
  styles: [`.placeholder { padding: 1.5rem; color: var(--mat-sys-on-surface-variant); }`],
})
export class PerfilComponent {}
