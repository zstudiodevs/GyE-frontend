# GyE Frontend – Project Guidelines

Angular 21.2 · Angular Material 21.2 · Zoneless · Signals · Standalone

## Dominio de la aplicación

**Club Gimnasia y Esgrima de Concepción del Uruguay**, Entre Ríos, Argentina.

La aplicación digitaliza el proceso de reserva de turnos para jugar **Pelota Paleta**, reemplazando el sistema actual basado en un grupo de WhatsApp. El objetivo es ofrecer un proceso simple, directo e igualitario.

> La mayoría de los usuarios son socios mayores de 45 años. La UX debe priorizar **pocos pasos**, **textos descriptivos** y **interacciones claras**. Mobile-first es obligatorio.

### Actores y roles

El sistema implementa **RBAC** (Role-Based Access Control). Los roles y permisos son gestionados desde el panel de administración. Roles base conocidos:

| Rol | Acceso |
|-----|--------|
| **Socio** | Reservar turnos, invitar socios, ver historial propio, cancelar (hasta 1h antes) |
| **Administrador** | Todo lo del socio + vista global de reservas, cancelar cualquier reserva, gestionar disponibilidad de canchas/horarios, dar de alta/baja socios, gestionar roles y permisos |

### Reglas de negocio

- **Autenticación**: Email y contraseña. JWT gestionado desde el backend.
- **Cancha y horarios**: Actualmente 1 cancha, disponible los **domingos a las 22 hs**. La configuración de disponibilidad debe ser flexible para soportar más canchas/horarios en el futuro.
- **Capacidad por turno**: 2 o 4 jugadores.
- **Creación de turno**: El creador elige la modalidad del turno:
  - **Cerrado con invitaciones**: Invita activamente a socios buscando por nombre, apellido, email o número de socio (todos campos string).
  - **Abierto**: El turno es visible para todos los socios; cualquiera puede solicitar unirse.
  - **Combinado**: Ambas opciones activas simultáneamente.
- **Cancelación**: Permitida hasta **1 hora antes** del turno. No se puede cancelar después de ese límite.
- **Historial**: Los socios ven sus reservas pasadas y futuras.
- **Notificaciones**: No incluidas en la fase inicial; planificadas para una iteración futura.

### Backend

El backend está en desarrollo paralelo e implementa RBAC. El contrato de API se define iterativamente. El frontend usa mocks/stubs hasta que los endpoints estén disponibles. Toda llamada HTTP desde servicios retorna `Observable`; se usa `toSignal()` en el componente para convertir a señales.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Angular `^21.2.0` |
| UI library | Angular Material `^21.2.5` (`@angular/material`) |
| Change detection | **Zoneless** (`provideZonelessChangeDetection()`) |
| Reactivity | Angular Signals (`signal`, `computed`, `effect`) |
| Components | Standalone-only (no `NgModule`) |
| Styling | SCSS per component + global partials in `src/styles/` |

## Architecture

```
src/
  app/
    core/
      services/          # Singleton services (e.g. theme.service.ts)
    features/            # Feature folders: component + service + routes per feature
    shared/              # Reusable standalone components, pipes, directives
    app.config.ts        # Root application configuration
    app.routes.ts        # Root route definitions
  styles/
    _glow.scss           # Global glow animations & focus/hover effects
  styles.scss            # Global styles, Material 3 theme definition
```

- **Feature-first** folder structure — everything a feature needs lives in `features/<name>/`.
- Route lazy-loading via `loadComponent` and `loadChildren` for every feature.
- No barrel `index.ts` files unless a feature exports a stable public API.

## Theme System

The app uses a **dual Material 3 theme** based on `mat.$azure-palette` (celeste/sky-blue). Neutrals (white, black, gray) are generated automatically by M3.

| Mode | Activation |
|---|---|
| Light (default) | `html` root — no class |
| Dark | `html.dark-theme` class toggled by `ThemeService` |

**`ThemeService`** (`core/services/theme.service.ts`):
- Reads initial preference from `localStorage` (`gye-theme`), falls back to `prefers-color-scheme`.
- Exposes `theme` (read-only signal), `isDark` (computed), `toggle()`, `setTheme()`.
- Must be injected in `AppComponent` to ensure it boots at startup.

**Glow system** (`src/styles/_glow.scss`):
- CSS vars `--glow-color` / `--glow-color-strong` switch automatically with the theme.
- Hover + `:focus-visible` glows are applied globally to Mat buttons, cards, form fields, chips, tabs, lists.
- Utility classes: `.glow`, `.glow-strong`, `.glow-pulse`, `.glow-text`, `.glow-text-pulse`.

## Code Style

### Components

- Every component is `standalone: true` — never add it to an `NgModule`.
- Always use `changeDetection: ChangeDetectionStrategy.OnPush`.
- Inject dependencies with the `inject()` function, not constructor injection.
- Prefer `input()` / `output()` signal-based APIs over `@Input()` / `@Output()`.
- Use `model()` for two-way bindable inputs.
- Avoid `ngOnInit`; use `effect()` or computed initialization where possible.

```typescript
// ✅ Correct component skeleton
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>{{ title() }}</p>`,
})
export class ExampleComponent {
  private readonly exampleService = inject(ExampleService);
  readonly title = input.required<string>();
  readonly count = signal(0);
}
```

### Services

- Use `providedIn: 'root'` unless explicitly scoped to a feature/component.
- Expose state as `readonly` signals or `computed` values — never expose raw `WritableSignal`.
- Avoid `BehaviorSubject`/`Subject` for local state; prefer signals. Use RxJS only for async event streams (HTTP, WebSockets).

### Routing

- Define routes with the `Routes` type in `*.routes.ts` files.
- Use `loadComponent` for lazy standalone components.
- Pass route data with typed `ResolveFn` resolvers — avoid snapshot reads in components.

### Angular Material

- Import individual Material modules per component (e.g., `MatButtonModule`, `MatInputModule`).
- Use the `mat` prefix for all Material directives (`matInput`, `matButton`, etc.).
- Apply the app theme from `styles.scss`; never write inline styles for theming.
- Never use `color="warn"` or `color="accent"` — these are M2 patterns. Use M3 system vars directly.

## Build & Test

```bash
npm install          # Install dependencies
ng serve             # Dev server → http://localhost:4200
ng build             # Production build
ng test              # Unit tests
ng lint              # Lint
```

## Conventions

- **Mobile-first**: Design and style for small screens by default; use `@media (min-width: ...)` breakpoints to progressively enhance for larger viewports. Use Angular Material's `BreakpointObserver` for layout-driven logic in components.
- **No `zone.js`**: `zone.js` must not be imported anywhere. The app bootstraps with `provideZonelessChangeDetection()` in `app.config.ts`.
- **No `CommonModule`**: Use `NgIf`, `NgFor`, `AsyncPipe`, etc. from `@angular/common` only as individual imports, never `CommonModule`.
- **`@if` / `@for` / `@switch`** control flow blocks (Angular 17+ syntax) are preferred over `*ngIf` / `*ngFor` structural directives.
- File naming: `kebab-case.type.ts` (e.g., `user-profile.component.ts`, `auth.service.ts`).
- Every public service method that performs an HTTP call returns an `Observable`; use `toSignal()` at the component boundary to bridge RxJS → Signals.
- Write tests for services and complex components. Use `TestBed` with `provideZonelessChangeDetection()` in test configuration.
