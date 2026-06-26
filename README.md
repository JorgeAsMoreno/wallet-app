# Wallet App

Web app que simula el flujo básico de una **wallet financiera**:

> **Login → Home → Nueva Transacción → Confirmación / Comprobante**

Construida con **Next.js + TypeScript**. Todos los datos son **mockeados** (no hay backend ni autenticación real): el foco está en las decisiones de diseño que importan en producción —tipado, arquitectura, estado, permisos, manejo de errores y reutilización de componentes— pensadas para un entorno de **alto volumen con millones de usuarios**.

Este README documenta el stack, la arquitectura, los patrones, el testing y, sobre todo, **por qué** cada decisión cumple lo que pide el reto.

---

## Índice

1. [Stack tecnológico](#1-stack-tecnológico)
2. [Cómo ejecutar](#2-cómo-ejecutar)
3. [Arquitectura](#3-arquitectura)
4. [Decisiones de renderizado (SSR/CSR)](#4-decisiones-de-renderizado-ssrcsr)
5. [Gestión de estado](#5-gestión-de-estado)
6. [Validación y reglas de negocio](#6-validación-y-reglas-de-negocio)
7. [Manejo de errores y escenarios de confirmación](#7-manejo-de-errores-y-escenarios-de-confirmación)
8. [Tipado seguro del dinero](#8-tipado-seguro-del-dinero)
9. [Sesión y permisos](#9-sesión-y-permisos)
10. [Componentes reutilizables y estilos](#10-componentes-reutilizables-y-estilos)
11. [Capa de mocks](#11-capa-de-mocks)
12. [Testing](#12-testing)
13. [Cumplimiento del reto](#13-cumplimiento-del-reto)

---

## 1. Stack tecnológico

| Capa | Tecnología | Versión | Por qué |
|------|-----------|---------|---------|
| Framework | **Next.js** (App Router) | `16.2.9` | SSR/CSR combinados, API Routes, routing por archivos, Server/Client Components. |
| Lenguaje | **TypeScript** | `5.x` | Tipado estático estricto: contrato compartido cliente↔servidor, refactors seguros a escala. |
| UI | **React** | `19.2.4` | Server Components + hooks. |
| Estado de servidor | **@tanstack/react-query** | `5.x` | Caché, `staleTime`, reintentos e invalidación de datos asíncronos. |
| Estado de UI | **zustand** | `5.x` | Estado global mínimo y sin boilerplate (wizard de transferencia, sesión). |
| Formularios | **react-hook-form** + **@hookform/resolvers** | `7.x` / `5.x` | Estado de formulario performante (renders mínimos) integrado con Zod. |
| Validación | **zod** | `4.x` | Schema-first: una sola fuente de verdad de validación, tipos inferidos. |
| Estilos | **Sass (SCSS Modules)** | `1.x` | Estilos con scope por componente + design tokens. |
| Utilidades | **clsx**, **date-fns**, **lucide-react** | — | Clases condicionales, fechas, iconos. |
| Testing unitario | **Vitest** + **Testing Library** + **jsdom** | `4.x` / `16.x` | Tests rápidos de dominio, hooks y componentes. |

> **Nota sobre la versión de Next.js.** Este proyecto usa una build de Next.js con cambios respecto a la documentación pública (ver [AGENTS.md](AGENTS.md)). Antes de modificar comportamiento del framework, consulta `node_modules/next/dist/docs/`.

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

## 3. Arquitectura

La estructura es **feature-driven** con una capa transversal `core`. La idea: que cada dominio del negocio sea autocontenido y que la lógica pura (dinero, reglas, errores) viva separada de la UI y del transporte HTTP. Esto es lo que hace el código mantenible y escalable cuando crece el equipo y el producto.

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

### Las tres capas y su porqué

- **`features/` (dominio)** — cada feature agrupa sus tipos, reglas, schemas, servicios, hooks y store. Un cambio en "transferencias" no obliga a tocar "wallet". Escala por equipos y por features.
- **`core/` (lógica pura transversal)** — dinero, `Result`, cliente HTTP y contratos de API. Es código **testeable de forma aislada** y reutilizable desde cualquier feature, sin acoplarse a React ni a Next.
- **`components/ui/` (presentación)** — componentes tontos y reutilizables. La lógica vive en hooks/dominio; los componentes solo pintan.

---

## 4. Decisiones de renderizado (SSR/CSR)

El reto pide **justificar** SSR vs CSR. La estrategia es **combinada**:

| Zona | Estrategia | Justificación |
|------|-----------|---------------|
| [`app/(app)/layout.tsx`](src/app/(app)/layout.tsx) | **Server Component** dinámico | Lee la cookie de sesión con `cookies()` (Request-time API). Esto opta el grupo a **dynamic rendering**, lo cual es correcto porque son **datos por usuario** (no cacheables estáticamente). Sirve además como guard de servidor (defensa en profundidad junto al middleware). |
| Páginas (login, home, transfer) | **Client Components** | Son pantallas **interactivas y con estado**: formularios, wizard multipaso, mutaciones. El CSR es el modelo natural aquí. |
| `not-found.tsx` | **Server Component** | Contenido estático sin estado. |

**Hidratación de sesión.** El layout de servidor lee la cookie y pasa la sesión a [`AuthHydrator`](src/features/auth/components/AuthHydrator.tsx), que siembra el store de Zustand en el cliente. Así la sesión **sobrevive a un refresh duro** sin que el store de cliente se "contamine" entre requests del servidor.

---

## 5. Gestión de estado

Se usan **tres herramientas, cada una para lo que mejor resuelve**, en lugar de meter todo en un único store global:

| Tipo de estado | Herramienta | Dónde |
|----------------|-------------|-------|
| **Estado de servidor** (saldo, movimientos, contactos) | **React Query** | [`useAccount`](src/features/wallet/hooks/useAccount.ts), `useMovements`, `useContacts` |
| **Estado de UI efímero** (paso del wizard, monto, destinatario) | **Zustand** | [`transferStore.ts`](src/features/transactions/store/transferStore.ts) |
| **Estado de formulario** (inputs, errores de validación) | **React Hook Form** | login, AmountStep, ContactStep |

**Por qué no Redux ni Context:** Redux añade boilerplate innecesario para este alcance; el Context de React provoca re-renders amplios y no resuelve caché/asincronía. **React Query** ya gestiona el estado de servidor (caché con `staleTime`, reintentos, invalidación) —ver [`providers.tsx`](src/lib/providers.tsx) (`staleTime` 1 min, `retry: 1`)— y **Zustand** cubre el poco estado global de UI con una API mínima y selectores granulares.

### El wizard como máquina de estados

[`transferStore.ts`](src/features/transactions/store/transferStore.ts) modela el flujo con pasos explícitos (`amount → contact → summary → result`). Las acciones avanzan el paso de forma controlada:

```ts
setAmount:     (amount)    => set({ amount, step: WIZARD_STEP.Contact }),
setRecipient:  (recipient) => set({ recipient, idempotencyKey: newIdempotencyKey(), step: WIZARD_STEP.Summary }),
setOutcome:    (outcome)   => set({ outcome, step: WIZARD_STEP.Result }),
reset:         ()          => set(INITIAL_STATE),  // limpia al salir, evita datos rancios al re-entrar
```

La **clave de idempotencia** se genera al fijar el destinatario (al entrar al resumen) y se **reutiliza en los reintentos** del mismo envío lógico —exactamente cuando importa para no duplicar un cargo—. Cambiar monto/destinatario la regenera; `reset()` la limpia.

---

## 6. Validación y reglas de negocio

El reto define tres reglas obligatorias antes de confirmar. Se implementan en el **dominio** y se aplican **dos veces (cliente y servidor)** = *defensa en profundidad*.

Fuente única: [`features/transactions/domain/rules.ts`](src/features/transactions/domain/rules.ts)

```ts
export const amountIsPositive     = (amount: Cents)            => amount > 0;
export const balanceIsSufficient  = (amount: Cents, b: Cents)  => amount <= b;
export const hasRecipient         = (r: Contact | null): r is Contact => r !== null;

export function validateTransfer(candidate): Result<ValidatedTransfer, TransferViolation[]> { … }
```

| Regla del reto | Función | Violación tipada |
|----------------|---------|------------------|
| Monto mínimo (no cero ni negativo) | `amountIsPositive` | `AMOUNT_TOO_LOW` |
| Saldo suficiente | `balanceIsSufficient` | `INSUFFICIENT_FUNDS` (con `available` y `requested`) |
| Destinatario obligatorio | `hasRecipient` | `RECIPIENT_REQUIRED` |

**Dónde se aplican:**

- **Cliente** — `AmountStep` valida monto y saldo en el momento del input para dar feedback inmediato; `validateTransfer` agrupa todas las violaciones.
- **Servidor** — [`api/transfer/route.ts`](src/app/api/transfer/route.ts) **vuelve a ejecutar** `validateTransfer` antes de descontar el saldo. El cliente nunca es la única línea de defensa:

```ts
const validation = validateTransfer({ amount: cents(body.amount), recipient, availableBalance: getAccount().balance });
if (!validation.ok) { /* → 422 InsufficientFunds | ValidationError */ }
```

`validateTransfer` devuelve un [`Result<T, E>`](src/core/result/index.ts) (éxito/error explícito en el tipo, sin excepciones para el flujo de validación), lo que obliga a manejar el caso de error en tiempo de compilación.

**Validación de formularios con Zod.** El login valida formato de email/teléfono con [`loginSchema`](src/features/auth/schema.ts) y el schema se **reutiliza en cliente y en la API** (`/api/session`). Monto y nuevo contacto usan [`amountSchema` y `newContactSchema`](src/features/transactions/schema.ts).

---

## 7. Manejo de errores y escenarios de confirmación

El reto exige que la confirmación sea **aleatoria** y cubra todos los escenarios. El servidor los inyecta y el cliente los maneja con tipos.

### En el servidor

[`mocks/utils.ts`](src/mocks/utils.ts) → `pickTransferScenario()` elige aleatoriamente; [`api/transfer/route.ts`](src/app/api/transfer/route.ts) responde en consecuencia:

| Escenario | Respuesta del servidor |
|-----------|------------------------|
| Éxito | `200` con el comprobante (`receipt`) |
| Fondos insuficientes | `422` `INSUFFICIENT_FUNDS` (tras validación real) |
| Error de red | `503` `NETWORK_ERROR` |
| Timeout | espera larga → el `AbortController` del cliente corta |
| Error desconocido | `500` `UNKNOWN_ERROR` |

### En el cliente

[`core/http/client.ts`](src/core/http/client.ts) envuelve `fetch` con **timeout vía `AbortController`** (10 s por defecto) y normaliza todo a **errores tipados**: `HttpError`, `NetworkError`, `TimeoutError`.

Luego [`domain/mappers.ts`](src/features/transactions/domain/mappers.ts) traduce cualquier resultado a una **unión discriminada** `TransferOutcome`:

```ts
mapToTransferOutcome(response, error)
//  → { status: 'success', receipt } | 'insufficient_funds' | 'network_error' | 'timeout' | 'unknown_error'
```

Así la Ui (`ResultStep`) **nunca toca HTTP**: hace un `switch` exhaustivo sobre `outcome.status` y muestra comprobante, error descriptivo de fondos, opción de **reintentar** (red/timeout) o un **fallback genérico**. El reintento reutiliza la **misma clave de idempotencia** (ver [Gestión de estado](#5-gestión-de-estado)).

Al confirmarse con éxito, [`useTransfer`](src/features/transactions/hooks/useTransfer.ts) guarda el `outcome` y se invalidan las queries de saldo/movimientos para que el Home refleje el nuevo estado.

---

## 8. Tipado seguro del dinero

Manejar dinero como `number` suelto es una fuente clásica de bugs (mezclar pesos con centavos, errores de punto flotante). [`core/money/index.ts`](src/core/money/index.ts) lo evita con un **branded type**:

```ts
export type Cents = number & { readonly [CENTS_BRAND]: never };

export function cents(value: number): Cents { /* exige entero */ }
export function parseAmountToCents(input: string): Result<Cents, 'INVALID_FORMAT'> { … }
export function formatMoney(value: Cents): string { /* Intl es-MX, MXN */ }
```

- Todo el dinero se representa en **centavos enteros** → cero aritmética con flotantes.
- `Cents` no es asignable desde un `number` cualquiera: el compilador impide pasar un valor sin validar.
- `parseAmountToCents` convierte el input del usuario (`"1.50"` / `"1,50"`) a centavos devolviendo un `Result`, nunca lanzando.
- Formato localizado a **MXN / es-MX**.

---

## 9. Sesión y permisos

Sesión **mockeada** (sin auth real, tal como pide el reto) pero con un modelo de permisos realista y en capas:

1. **Login** → [`useLogin`](src/features/auth/hooks/useLogin.ts) llama a `/api/session`, guarda la sesión en una **cookie** `wallet_session` ([`session.ts`](src/features/auth/session.ts)) y en el store de Zustand.
2. **Middleware Edge** ([`middleware.ts`](src/middleware.ts)) — protege rutas: sin cookie → redirige a `/login`; con cookie intentando ir a `/login` → redirige a `/`.
3. **Guard de servidor** ([`(app)/layout.tsx`](src/app/(app)/layout.tsx)) — relee la cookie, valida expiración y redirige si caducó (defensa en profundidad).
4. **Hidratación** — `AuthHydrator` siembra el store del cliente para que la sesión sobreviva al refresh.

La cookie es un JSON codificado (no un JWT); es deliberadamente simple porque la persistencia es mock. La arquitectura, sin embargo, es la misma que usarías con tokens reales.

---

## 10. Componentes reutilizables y estilos

**Componentes UI** en [`src/components/ui/`](src/components/ui/) — tontos, tipados y componibles:

- **Button** — variantes (`primary`/`secondary`/`ghost`), tamaños, estado `isLoading` (deshabilita y muestra "Cargando…"), `clsx` para componer clases.
- **Input** — label opcional y errores accesibles (`aria-invalid`, `aria-describedby`, `role="alert"`).
- **Card / Skeleton** — superficie consistente y placeholders de carga (`aria-hidden`).
- **BalanceCard, MovementsList/MovementItem** y los pasos del wizard (**AmountStep, ContactStep, SummaryStep, ResultStep**).

**Estados asíncronos** — p. ej. [`MovementsList`](src/components/ui/MovementList/MovementList.tsx) cubre los tres estados que pide el reto: **carga** (skeletons), **vacío** ("Sin movimientos por ahora") y **error** (mensaje + botón *Reintentar*).

**Estilos** — **SCSS Modules** con scope por componente sobre **design tokens** ([`styles/_tokens.scss`](src/styles/_tokens.scss)): colores de marca/semánticos, tipografía, espaciado y radios como variables CSS. Diseño **mobile-first** centrado a 480 px de ancho máximo.

---

## 11. Capa de mocks

Todo el "backend" vive en API Routes que leen de mocks:

- [`mocks/data.ts`](src/mocks/data.ts) — datos semilla (usuario, sesión, cuenta con saldo en `Cents`, movimientos, contactos).
- [`mocks/state.ts`](src/mocks/state.ts) — **estado mutable en memoria** (`getAccount`, `applyTransfer`) para que una transferencia exitosa **descuente el saldo y registre un movimiento**, y el Home lo refleje.
- [`mocks/utils.ts`](src/mocks/utils.ts) — `simulateDelay` (latencias realistas), `mockId` y `pickTransferScenario` (escenarios aleatorios).

**Limitacion:** el estado en memoria se **reinicia** al reiniciar el server o con hot-reload y no es *serverless-safe* (varias instancias no comparten estado). Es lo correcto para una demo mock; en producción se sustituye la capa de `services`/API por la real sin tocar el dominio ni la UI.

---

## 12. Testing

Framework: **Vitest + Testing Library (jsdom)**. Tests en [`src/tests/unit/`](src/tests/unit/).

**Estrategia:** priorizar lo que más riesgo concentra —**lógica de dominio, validaciones y un componente crítico**— en lugar de perseguir cobertura ciega de UI. Esa lógica es pura y determinista, así que da el mayor retorno por test.

| Archivo | Qué prueba | Por qué |
|---------|-----------|---------|
| [`domain/money.test.ts`](src/tests/unit/domain/money.test.ts) | `cents` (rechaza no enteros), `parseAmountToCents` (dot/coma, vacíos, >2 decimales, precisión), `formatMoney`, `add/subtractCents` | El dinero es lo más sensible: un bug aquí es un bug financiero. |
| [`domain/rules.test.ts`](src/tests/unit/domain/rules.test.ts) | `amountIsPositive`, `balanceIsSufficient`, `hasRecipient`, `validateTransfer` (acumula violaciones) | Son las **tres reglas de negocio** del reto. |
| [`domain/schemas.test.ts`](src/tests/unit/domain/schemas.test.ts) | `loginSchema` (email/teléfono), `amountSchema`, `newContactSchema` | Garantiza el contrato de validación de los formularios. |
| [`domain/mappers.test.ts`](src/tests/unit/domain/mappers.test.ts) | `mapToTransferOutcome`: success, timeout, network, HTTP 503, insufficient_funds, unknown | Asegura que **todos** los escenarios de confirmación se mapean correctamente. |
| [`components/Button.test.tsx`](src/tests/unit/components/Button.test.tsx) | render, `isLoading`, disabled, handler de click | Componente crítico y transversal a toda la app. |


```bash
npm run test            # unitarios
npm run test:coverage   # con cobertura
```

---

## 13. Cumplimiento del reto

| Requisito | Dónde se cumple |
|-----------|-----------------|
| **Login**: teléfono o email, validación de formato y requeridos | [`schema.ts`](src/features/auth/schema.ts) + login page (RHF + Zod) |
| Login: estados de carga y error simulado | `useLogin` (React Query) + `/api/session` con `simulateDelay` |
| Login: persistencia de sesión + navegación a Home | Cookie `wallet_session` + `useAuthStore` + redirect |
| **Home**: saldo + nombre del usuario | [`page.tsx`](src/app/(app)/page.tsx) + `BalanceCard` |
| Home: lista de movimientos | `MovementsList` / `MovementItem` |
| Home: estados carga / vacío / error | [`MovementList.tsx`](src/components/ui/MovementList/MovementList.tsx) |
| Home: acción para nueva transacción | Botón "Enviar dinero" → `/transfer` |
| **Transacción**: ingresar monto | `AmountStep` (+ `parseAmountToCents`) |
| Transacción: seleccionar/crear contacto (mock) | `ContactStep` + `/api/contacts` (GET/POST) |
| Transacción: resumen antes de confirmar | `SummaryStep` |
| Transacción: confirmar con respuesta mock | `useTransfer` + `/api/transfer` |
| Transacción: comprobante / éxito | `ResultStep` (`status: 'success'`) |
| **Regla** monto > 0 / saldo suficiente / destinatario | [`rules.ts`](src/features/transactions/domain/rules.ts) (cliente **y** servidor) |
| **Confirmación aleatoria**: éxito, red, fondos, timeout, desconocido | `pickTransferScenario` + `mapToTransferOutcome` + `ResultStep` |
| Rendering SSR/CSR justificado | [§4](#4-decisiones-de-renderizado-ssrcsr) |
| Estado justificado | [§5](#5-gestión-de-estado) |
| Servicios con API Routes mock | [`src/app/api/`](src/app/api/) |
| Testing de validaciones/hooks/componentes | [§12](#12-testing) |

---

_Datos mock; sin servicios externos ni autenticación real, por diseño del reto._
