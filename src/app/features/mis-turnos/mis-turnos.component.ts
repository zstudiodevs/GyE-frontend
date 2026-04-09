import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="placeholder">Mis turnos — próximamente</p>`,
  styles: [`.placeholder { padding: 1.5rem; color: var(--mat-sys-on-surface-variant); }`],
})
export class MisTurnosComponent {}
