# Wallet App

Web app que simula el flujo básico de una **wallet financiera**:

> **Login → Home → Nueva Transacción → Confirmación / Comprobante**

Construida con **Next.js + TypeScript**. Todos los datos son **mockeados** (no hay backend ni autenticación real): el foco está en las decisiones de diseño que importan en producción —tipado, arquitectura, estado, permisos, manejo de errores y reutilización de componentes— pensadas para un entorno de **alto volumen con millones de usuarios**.

> 📐 El **porqué** de cada decisión (arquitectura, SSR/CSR, estado, errores, edge cases y qué haría diferente con más tiempo) está documentado en **[DECISIONS.md](DECISIONS.md)**.

---

## Índice

1. [Stack / librerías](#1-stack--librerías)
2. [Cómo ejecutar](#2-cómo-ejecutar)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Testing](#4-testing)
5. [Limitaciones conocidas](#5-limitaciones-conocidas)

---

## 1. Stack / librerías

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | **Next.js** (App Router) | `16.2.9` |
| Lenguaje | **TypeScript** | `5.x` |
| UI | **React** | `19.2.4` |
| Estado de servidor | **@tanstack/react-query** | `5.x` |
| Estado de UI | **zustand** | `5.x` |
| Formularios | **react-hook-form** + **@hookform/resolvers** | `7.x` / `5.x` |
| Validación | **zod** | `4.x` |
| Estilos | **Sass (SCSS Modules)** | `1.x` |
| Utilidades | **clsx**, **date-fns**, **lucide-react** | — |
| Testing | **Vitest** + **Testing Library** + **jsdom** | `4.x` / `16.x` |

> **Nota sobre la versión de Next.js.** Este proyecto usa una build de Next.js con cambios respecto a la documentación pública (ver [AGENTS.md](AGENTS.md)). Antes de modificar comportamiento del framework, consulta `node_modules/next/dist/docs/`.

El razonamiento detrás de cada elección está en [DECISIONS.md](DECISIONS.md).

---

## 2. Cómo ejecutar

Requisitos: **Node 20+**.

```bash
npm install      # instala dependencias
npm run dev      # arranca en http://localhost:3000
```

Como la sesión es mockeada, cualquier **correo válido** (`tu@correo.com`) o **teléfono válido** (`+5213121234567`, 10–15 dígitos) abre la app.

### Scripts disponibles

| Script | Acción |
|--------|--------|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Build de producción. |
| `npm run start` | Sirve el build de producción. |
| `npm run lint` | ESLint. |
| `npm run test` | Tests unitarios (Vitest, una pasada). |
| `npm run test:watch` | Tests en modo watch. |
| `npm run test:coverage` | Tests con reporte de cobertura. |
| `npm run test:e2e` | Tests E2E (Playwright). |
| `npm run format` | Formatea con Prettier. |

---

## 3. Estructura del proyecto

Arquitectura **feature-driven** con una capa transversal `core`. (El porqué, en [DECISIONS.md §1](DECISIONS.md#1-por-qué-esta-estructura-feature-driven--core).)

```
src/
├── app/                          # Next.js App Router (rutas, layouts, API)
│   ├── layout.tsx                # Root layout: fuentes, Providers (React Query), estilos
│   ├── not-found.tsx             # 404
│   ├── (auth)/login/page.tsx     # Login (Client Component)
│   ├── (app)/
│   │   ├── layout.tsx            # Guard de sesión (servidor) + hidratación del store
│   │   ├── page.tsx              # Home: saldo + movimientos
│   │   └── transfer/page.tsx     # Wizard de transferencia (4 pasos)
│   └── api/                      # API Routes mockeadas
│       ├── session/route.ts      # POST  login
│       ├── account/route.ts      # GET   saldo
│       ├── movements/route.ts    # GET   movimientos
│       ├── contacts/route.ts     # GET/POST contactos
│       └── transfer/route.ts     # POST  transferencia (validación + escenarios)
│
├── core/                         # Lógica transversal, sin dependencias de UI
│   ├── api/                      # Contratos compartidos cliente↔servidor + ApiErrorCode
│   ├── http/                     # Cliente fetch con timeout y errores tipados
│   ├── money/                    # Tipo branded `Cents`, parseo y formateo
│   └── result/                   # `Result<T, E>` estilo Rust
│
├── features/                     # Módulos de dominio autocontenidos
│   ├── auth/                     # schema, session (cookie), store, hooks, AuthHydrator
│   ├── wallet/                   # domain/types, services, hooks (useAccount, useMovements)
│   └── transactions/             # domain (rules, mappers, types), schema, services,
│       │                         #   hooks (useTransfer, useContacts) y store del wizard
│       └── store/transferStore.ts
│
├── components/ui/                # Componentes reutilizables (Button, Input, Card, Skeleton…)
├── lib/providers.tsx             # Provider de React Query
├── mocks/                        # data.ts, state.ts (estado mutable), utils.ts
├── styles/                       # _tokens, _globals, _mixins (SCSS)
├── tests/                        # unit/ (Vitest)
└── middleware.ts                 # Guard de rutas a nivel de Edge
```

Tres capas, de adentro hacia afuera:

- **`core/`** — lógica pura transversal (dinero, `Result`, cliente HTTP, contratos de API). Sin React ni Next; testeable de forma aislada.
- **`features/`** — módulos de dominio autocontenidos (auth, wallet, transactions): tipos, reglas, schemas, servicios, hooks y store por feature.
- **`components/ui/`** — presentación tonta y reutilizable; la lógica vive en hooks/dominio.

---

## 4. Testing

Framework: **Vitest + Testing Library (jsdom)**. Tests en [`src/tests/unit/`](src/tests/unit/), priorizando la lógica de dominio (dinero, reglas, schemas, mappers) y un componente crítico (`Button`).

```bash
npm run test            # unitarios
npm run test:coverage   # con cobertura
```

La estrategia de testing y el detalle por archivo están en [DECISIONS.md](DECISIONS.md#9-componentes-reutilizables-y-estilos).

---

## 5. Limitaciones conocidas

- **Estado mock en memoria.** [`mocks/state.ts`](src/mocks/state.ts) mantiene el saldo/movimientos en memoria: se **reinicia** al reiniciar el server o con hot-reload, y **no es serverless-safe** (varias instancias no comparten estado). En producción se sustituye la capa de `services`/API por la real sin tocar el dominio ni la UI.
- **Sin backend ni autenticación reales.** La cookie `wallet_session` es un JSON codificado, no un JWT; deliberadamente simple porque la persistencia es mock.
- **Idempotencia solo en memoria.** El servidor mock **sí** deduplica por `idempotencyKey` (un reintento devuelve el mismo comprobante sin doble cargo), pero el registro vive en memoria: se reinicia con el server. En producción sería una tabla con índice único sobre la clave.

---

## 6. Tiempo de desarrollo

- El challenge me tomo un dia en terminarlo Aprox (8 hrs). Desde la planeacion de como lo queria estructurar hasta pulir detalles visuales que iban apareciendo y documentacion.