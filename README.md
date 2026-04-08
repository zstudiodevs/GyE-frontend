# GyE Pelota Paleta – Frontend

Aplicación web para el club **Gimnasia y Esgrima de Concepción del Uruguay**, Entre Ríos, Argentina.

## Objetivo

Digitalizar el proceso de reserva de turnos para jugar **Pelota Paleta**, reemplazando el sistema informal de WhatsApp. La app permite a los socios reservar la cancha de forma simple, transparente e igualitaria.

## Contexto

Actualmente los socios coordinan turnos por un grupo de WhatsApp, lo que genera un proceso engorroso, opaco e inequitativo (dependencia del administrador del grupo, problemas de conectividad, posibilidad de favoritismos). Esta app resuelve ese problema con un sistema centralizado, justo y auditable.

## Funcionalidades

### Para socios

- **Autenticación**: Login con email y contraseña.
- **Reserva de turnos**: Reservar la cancha disponible (actualmente domingos a las 22 hs; configurable).
- **Capacidad por turno**: 2 o 4 jugadores.
- **Invitar socios**: El creador invita a otros socios buscando por nombre, apellido, email o número de socio.
- **Turnos abiertos**: El creador puede publicar el turno como abierto para que cualquier socio solicite unirse.
- **Cancelación**: Posible hasta 1 hora antes del inicio del turno.
- **Historial**: Vista de reserves pasadas y futuras propias.

### Para administradores

- **Vista global de reservas**: Ver y cancelar cualquier reserva.
- **Gestión de disponibilidad**: Configurar canchas, días y horarios habilitados.
- **Gestión de usuarios**: Alta y baja de socios.
- **RBAC**: Panel de control para crear roles personalizados con permisos configurables.

## Stack técnico

| Layer | Technology |
|-------|-----------|
| Framework | Angular `^21.2.0` |
| UI library | Angular Material `^21.2.5` |
| Change detection | Zoneless (`provideZonelessChangeDetection()`) |
| Reactivity | Angular Signals |
| Styling | SCSS + Material 3 (azure palette, light/dark) |
| Backend | REST API en desarrollo (contrato coordinado iterativamente) |

## Comandos de desarrollo

```bash
npm install          # Instalar dependencias
ng serve             # Servidor dev → http://localhost:4200
ng build             # Build de producción
ng test              # Tests unitarios (Vitest)
ng lint              # Linting
```

## Recursos

- [Angular CLI](https://angular.dev/tools/cli)
- [Angular Material](https://material.angular.io/)
