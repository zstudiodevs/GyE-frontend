# GyE Pelota Paleta - Frontend

Aplicacion web para el club **Gimnasia y Esgrima de Concepcion del Uruguay**, Entre Rios, Argentina.

## Objetivo

Digitalizar el proceso de reserva de turnos para jugar **Pelota Paleta**, reemplazando el sistema informal de WhatsApp. La app permite a los socios reservar la cancha de forma simple, transparente e igualitaria.

## Contexto

Actualmente los socios coordinan turnos por un grupo de WhatsApp, lo que genera un proceso engorros, opaco e inequitativo (dependencia del administrador del grupo, problemas de conectividad, posibilidad de favoritismos). Esta app resuelve ese problema con un sistema centralizado, justo y auditable.

## Funcionalidades

### Para socios

- **Autenticacion**: Login con email y contrasena.
- **Reserva de turnos**: Reservar la cancha disponible (actualmente domingos a las 22 hs; configurable).
- **Capacidad por turno**: 2 o 4 jugadores.
- **Invitar socios**: El creador invita a otros socios buscando por nombre, apellido, email o numero de socio.
- **Turnos abiertos**: El creador puede publicar el turno como abierto para que cualquier socio solicite unirse.
- **Cancelacion**: Posible hasta 1 hora antes del inicio del turno.
- **Historial**: Vista de reservas pasadas y futuras propias.

### Para administradores

- **Vista global de reservas**: Ver y cancelar cualquier reserva.
- **Gestion de disponibilidad**: Configurar canchas, dias y horarios habilitados.
- **Gestion de usuarios**: Alta y baja de socios.
- **RBAC**: Panel de control para crear roles personalizados con permisos configurables.

## Stack tecnico

| Layer | Technology |
|-------|------------|
| Framework | Angular ``^21.2.0`` |
| UI library | Angular Material ``^21.2.5`` |
| Change detection | Zoneless (``provideZonelessChangeDetection()``) |
| Reactivity | Angular Signals |
| Styling | SCSS + Material 3 (azure palette, light/dark) |
| Backend | REST API ``https://localhost:7098`` (dev) |

## Estado de desarrollo

| Area | Estado |
|------|--------|
| Bootstrap zoneless + tema Material 3 | Completo |
| Sistema de glows y tema claro/oscuro | Completo |
| Modelos de dominio (User, Role, AuthTokens, API) | Completo |
| AuthStoreService (signals + localStorage) | Completo |
| AuthService (login, refresh, logout, initSession) | Completo |
| authInterceptor (JWT + ciclo de refresh 401) | Completo |
| Guards: authGuard, guestGuard, adminGuard | Completo |
| Configuracion de entornos (dev/prod) | Completo |
| Shell layout (toolbar, bottom nav mobile, router-outlet) | Completo |
| Scaffold de rutas con lazy loading | Completo |
| Pagina de login | Completo |
| Feature: Reservas | Placeholder |
| Feature: Mis turnos | Placeholder |
| Feature: Perfil | Placeholder |
| Feature: Admin | Placeholder |
| Modelos de dominio de reservas (Booking, Court, Slot) | Pendiente |

## Comandos de desarrollo

```bash
npm install          # Instalar dependencias
ng serve             # Servidor dev -> http://localhost:4200
ng build             # Build de produccion
ng test              # Tests unitarios (Vitest)
ng lint              # Linting
```

> El backend de desarrollo debe estar corriendo en `https://localhost:7098` para que las llamadas HTTP funcionen.

## Recursos

- [Angular CLI](https://angular.dev/tools/cli)
- [Angular Material](https://material.angular.io/)