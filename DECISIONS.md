# Decisiones de diseño

Este documento explica **por qué** la app está construida como está: la arquitectura, la separación entre UI y lógica de negocio, las decisiones de renderizado/estado/errores, los **edge cases** considerados y **qué haría diferente con más tiempo**.

Para correr el proyecto, ver [README.md](README.md).

> El reto pide datos mockeados; el foco está en las decisiones que importan en producción a **alto volumen** (millones de usuarios): tipado, arquitectura, estado, permisos, manejo de errores y reutilización.

---

## Índice

1. [Por qué esta estructura (feature-driven + core)](#1-por-qué-esta-estructura-feature-driven--core)
2. [Cómo separé UI y lógica de negocio](#2-cómo-separé-ui-y-lógica-de-negocio)
3. [Decisiones de renderizado (SSR/CSR)](#3-decisiones-de-renderizado-ssrcsr)
4. [Gestión de estado](#4-gestión-de-estado)
5. [Validación y reglas de negocio](#5-validación-y-reglas-de-negocio)
6. [Manejo de errores y escenarios de confirmación](#6-manejo-de-errores-y-escenarios-de-confirmación)
7. [Tipado seguro del dinero](#7-tipado-seguro-del-dinero)
8. [Sesión y permisos](#8-sesión-y-permisos)
9. [Componentes reutilizables, estilos y testing](#9-componentes-reutilizables-estilos-y-testing)
10. [Edge cases considerados](#10-edge-cases-considerados)
11. [Qué haría diferente con más tiempo](#11-qué-haría-diferente-con-más-tiempo)
12. [Cumplimiento del reto](#12-cumplimiento-del-reto)

---

## 1. Por qué esta estructura (feature-driven + core)

La estructura es **feature-driven** con una capa transversal `core`. La idea: que cada dominio del negocio sea autocontenido y que la lógica pura (dinero, reglas, errores) viva separada de la UI y del transporte HTTP. Esto es lo que hace el código mantenible y escalable cuando crece el equipo y el producto.

El árbol de carpetas está en [README.md §3](README.md#3-estructura-del-proyecto). El razonamiento por capa:

- **`features/` (dominio)** — cada feature agrupa sus tipos, reglas, schemas, servicios, hooks y store. Un cambio en "transferencias" no obliga a tocar "wallet". Escala por equipos y por features.
- **`core/` (lógica pura transversal)** — dinero, `Result`, cliente HTTP y contratos de API. Es código **testeable de forma aislada** y reutilizable desde cualquier feature, sin acoplarse a React ni a Next.
- **`components/ui/` (presentación)** — componentes tontos y reutilizables. La lógica vive en hooks/dominio; los componentes solo pintan.

---

## 2. Cómo separé UI y lógica de negocio

La regla es simple: **la UI nunca decide reglas de negocio ni toca HTTP**. Cada responsabilidad vive en su capa:

- **`core/`** no importa React. Es lógica pura (dinero, `Result<T,E>`, cliente HTTP, contratos). Se puede testear sin montar componentes.
- **`features/`** contiene el dominio: reglas (`validateTransfer`), mappers (`mapToTransferOutcome`), schemas Zod, servicios y los hooks que orquestan React Query / Zustand. Aquí está toda la lógica.
- **`components/ui/`** solo pinta. Recibe props, dispara callbacks de los hooks y hace `switch` sobre estados ya normalizados.

Dos patrones refuerzan esta separación:

- **Reglas en un solo lugar, aplicadas dos veces.** Las reglas de negocio viven en [`features/transactions/domain/rules.ts`](src/features/transactions/domain/rules.ts) y se ejecutan **tanto en cliente como en servidor** (ver [§5](#5-validación-y-reglas-de-negocio)). Una regla nueva va ahí, no inline en la UI.
- **La UI nunca toca HTTP.** Las peticiones pasan por [`core/http/client.ts`](src/core/http/client.ts) y se normalizan a una unión discriminada (`TransferOutcome`) en [`mappers.ts`](src/features/transactions/domain/mappers.ts). El componente solo hace un `switch` exhaustivo (ver [§6](#6-manejo-de-errores-y-escenarios-de-confirmación)).

---

## 3. Decisiones de renderizado (SSR/CSR)

La estrategia es **combinada**, eligiendo por tipo de pantalla:

| Zona | Estrategia | Justificación |
|------|-----------|---------------|
| [`app/(app)/layout.tsx`](src/app/(app)/layout.tsx) | **Server Component** dinámico | Lee la cookie de sesión con `cookies()` (Request-time API). Esto opta el grupo a **dynamic rendering**, lo cual es correcto porque son **datos por usuario** (no cacheables estáticamente). Sirve además como guard de servidor (defensa en profundidad junto al middleware). |
| Páginas (login, home, transfer) | **Client Components** | Son pantallas **interactivas y con estado**: formularios, wizard multipaso, mutaciones. El CSR es el modelo natural aquí. |
| `not-found.tsx` | **Server Component** | Contenido estático sin estado. |

**Server Action — logout.** El cierre de sesión es un [Server Action](src/features/auth/actions.ts) (`'use server'`), no un `fetch` a una API Route: el botón "Salir" del Home es un `<form action={logoutAction}>` que borra la cookie en el servidor con `cookies().delete()` y redirige, en un solo roundtrip. Es el caso donde un Server Action encaja mejor que una API Route (mutación + navegación, sin necesidad de respuesta tipada en cliente). Las transferencias, en cambio, se quedan en API Route + `fetch` a propósito, porque ahí **sí** necesito control fino de timeout/`AbortController` y de los escenarios de error.

**Hidratación de sesión.** El layout de servidor lee la cookie y pasa la sesión a [`AuthHydrator`](src/features/auth/components/AuthHydrator.tsx), que siembra el store de Zustand en el cliente. Así la sesión **sobrevive a un refresh duro** sin que el store de cliente se "contamine" entre requests del servidor.

---

## 4. Gestión de estado

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

La **clave de idempotencia** se genera al fijar el destinatario (al entrar al resumen) y se **reutiliza en los reintentos** del mismo envío lógico —exactamente cuando importa para no duplicar un cargo—. Cambiar monto/destinatario la regenera; `reset()` la limpia. El **servidor la honra**: [`api/transfer/route.ts`](src/app/api/transfer/route.ts) deduplica por clave (ver [§6](#6-manejo-de-errores-y-escenarios-de-confirmación)), así que la protección contra doble cargo es real, no solo intención del cliente.

---

## 5. Validación y reglas de negocio

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

- **Cliente** — `AmountStep` valida monto y saldo en el momento del input para dar feedback inmediato; `amountIsPositive/balanceIsSufficient` agrupa todas las violaciones.
- **Servidor** — [`api/transfer/route.ts`](src/app/api/transfer/route.ts) **vuelve a ejecutar** `validateTransfer` antes de descontar el saldo. El cliente nunca es la única línea de defensa:

```ts
const validation = validateTransfer({ amount: cents(body.amount), recipient, availableBalance: getAccount().balance });
if (!validation.ok) { /* → 422 InsufficientFunds | ValidationError */ }
```

`validateTransfer` devuelve un [`Result<T, E>`](src/core/result/index.ts) (éxito/error explícito en el tipo, sin excepciones para el flujo de validación), lo que obliga a manejar el caso de error en tiempo de compilación.

**Validación de formularios con Zod.** El login valida formato de email/teléfono con [`loginSchema`](src/features/auth/schema.ts) y el schema se **reutiliza en cliente y en la API** (`/api/session`). Monto y nuevo contacto usan [`amountSchema` y `newContactSchema`](src/features/transactions/schema.ts).

---

## 6. Manejo de errores y escenarios de confirmación

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

Así la UI (`ResultStep`) **nunca toca HTTP**: hace un `switch` exhaustivo sobre `outcome.status` y muestra comprobante, error descriptivo de fondos, opción de **reintentar** (red/timeout) o un **fallback genérico**. El reintento reutiliza la **misma clave de idempotencia** (ver [§4](#4-gestión-de-estado)).

Al confirmarse con éxito, [`useTransfer`](src/features/transactions/hooks/useTransfer.ts) guarda el `outcome` y se invalidan las queries de saldo/movimientos para que el Home refleje el nuevo estado.

**Idempotencia en el servidor.** Antes de procesar, [`route.ts`](src/app/api/transfer/route.ts) consulta la `idempotencyKey` en un registro de comprobantes emitidos ([`mocks/state.ts`](src/mocks/state.ts)): si esa clave ya se aplicó, devuelve **el mismo comprobante** con `200` sin volver a descontar el saldo. Así, un reintento tras un error de red que en realidad sí pegó en el servidor no genera un doble cargo. El registro es en memoria (limitación del mock); en producción sería una tabla con índice único sobre la clave.

**Validación del contrato.** El body se valida con `transferRequestSchema` ([`schema.ts`](src/features/transactions/schema.ts)) al inicio del handler, igual que `/api/session` y `/api/contacts`: un body malformado devuelve un `422` limpio en vez de reventar dentro de la lógica.

---

## 7. Tipado seguro del dinero

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

## 8. Sesión y permisos

Sesión **mockeada** (sin auth real, tal como pide el reto) pero con un modelo de permisos realista y en capas:

1. **Login** → [`useLogin`](src/features/auth/hooks/useLogin.ts) llama a `/api/session`, guarda la sesión en una **cookie** `wallet_session` ([`session.ts`](src/features/auth/session.ts)) y en el store de Zustand.
2. **Middleware Edge** ([`middleware.ts`](src/middleware.ts)) — protege rutas: sin cookie → redirige a `/login`; con cookie intentando ir a `/login` → redirige a `/`.
3. **Guard de servidor** ([`(app)/layout.tsx`](src/app/(app)/layout.tsx)) — relee la cookie, valida expiración y redirige si caducó (defensa en profundidad).
4. **Hidratación** — `AuthHydrator` siembra el store del cliente para que la sesión sobreviva al refresh.

La cookie es un JSON codificado (no un JWT); es deliberadamente simple porque la persistencia es mock. La arquitectura, sin embargo, es la misma que usarías con tokens reales.

---

## 9. Componentes reutilizables, estilos y testing

### Componentes y estilos

**Componentes UI** en [`src/components/ui/`](src/components/ui/) — tontos, tipados y componibles:

- **Button** — variantes (`primary`/`secondary`/`ghost`), tamaños, estado `isLoading` (deshabilita y muestra "Cargando…"), `clsx` para componer clases.
- **Input** — label opcional y errores accesibles (`aria-invalid`, `aria-describedby`, `role="alert"`).
- **Card / Skeleton** — superficie consistente y placeholders de carga (`aria-hidden`).
- **BalanceCard, MovementsList/MovementItem** y los pasos del wizard (**AmountStep, ContactStep, SummaryStep, ResultStep**).

**Estados asíncronos** — p. ej. [`MovementsList`](src/components/ui/MovementList/MovementList.tsx) cubre los tres estados que pide el reto: **carga** (skeletons), **vacío** ("Sin movimientos por ahora") y **error** (mensaje + botón *Reintentar*).

**Estilos** — **SCSS Modules** con scope por componente sobre **design tokens** ([`styles/_tokens.scss`](src/styles/_tokens.scss)): colores de marca/semánticos, tipografía, espaciado y radios como variables CSS. Diseño **mobile-first** centrado a 480 px de ancho máximo.

### Capa de mocks

Todo el "backend" vive en API Routes que leen de mocks:

- [`mocks/data.ts`](src/mocks/data.ts) — datos semilla (usuario, sesión, cuenta con saldo en `Cents`, movimientos, contactos).
- [`mocks/state.ts`](src/mocks/state.ts) — **estado mutable en memoria** (`getAccount`, `applyTransfer`) para que una transferencia exitosa **descuente el saldo y registre un movimiento**, y el Home lo refleje.
- [`mocks/utils.ts`](src/mocks/utils.ts) — `simulateDelay` (latencias realistas), `mockId` y `pickTransferScenario` (escenarios aleatorios).

### Testing

Framework: **Vitest + Testing Library (jsdom)**. Tests en [`src/tests/unit/`](src/tests/unit/).

**Estrategia:** priorizar lo que más riesgo concentra —**lógica de dominio, validaciones y un componente crítico**— en lugar de perseguir cobertura ciega de UI. Esa lógica es pura y determinista, así que da el mayor retorno por test.

| Archivo | Qué prueba | Por qué |
|---------|-----------|---------|
| [`domain/money.test.ts`](src/tests/unit/domain/money.test.ts) | `cents` (rechaza no enteros), `parseAmountToCents` (dot/coma, vacíos, >2 decimales, precisión), `formatMoney`, `add/subtractCents` | El dinero es lo más sensible: un bug aquí es un bug financiero. |
| [`domain/rules.test.ts`](src/tests/unit/domain/rules.test.ts) | `amountIsPositive`, `balanceIsSufficient`, `hasRecipient`, `validateTransfer` (acumula violaciones) | Son las **tres reglas de negocio** del reto. |
| [`domain/schemas.test.ts`](src/tests/unit/domain/schemas.test.ts) | `loginSchema` (email/teléfono), `amountSchema`, `newContactSchema` | Garantiza el contrato de validación de los formularios. |
| [`domain/mappers.test.ts`](src/tests/unit/domain/mappers.test.ts) | `mapToTransferOutcome`: success, timeout, network, HTTP 503, insufficient_funds, unknown | Asegura que **todos** los escenarios de confirmación se mapean correctamente. |
| [`components/Button.test.tsx`](src/tests/unit/components/Button.test.tsx) | render, `isLoading`, disabled, handler de click | Componente crítico y transversal a toda la app. |

---

## 10. Edge cases considerados

- **Timeout de red** — el cliente HTTP corta con `AbortController` a los 10 s y lo mapea a `timeout` (reintentable), en vez de quedar colgado.
- **Doble cargo en reintentos** — la **clave de idempotencia** se genera al fijar el destinatario y se reutiliza en cada reintento del mismo envío lógico; cambiar monto/destinatario la regenera. El servidor **deduplica por esa clave** ([`route.ts`](src/app/api/transfer/route.ts)): un reintento tras un fallo de red devuelve el mismo comprobante sin volver a cobrar.
- **Body malformado en la API** — `/api/transfer` valida el contrato con Zod antes de procesar, devolviendo un `422` limpio en vez de un `500` al pasar datos basura.
- **Aritmética financiera** — todo el dinero es `Cents` (enteros); cero operaciones en flotante → no hay errores de precisión al sumar/restar.
- **Input de monto malformado** — `parseAmountToCents` acepta `"1.50"` y `"1,50"`, rechaza vacíos, no numéricos y `>2` decimales, devolviendo un `Result` (nunca lanza). La UI muestra el error sin romperse.
- **Sesión tras refresh duro** — el layout de servidor relee la cookie e hidrata el store, de modo que un F5 no expulsa al usuario.
- **Sesión expirada** — el guard de servidor valida la expiración y redirige a `/login` aunque la cookie siga presente.
- **Estados de lista** — carga (skeletons), vacío y error con *Reintentar* están cubiertos explícitamente, no solo el "happy path".
- **Múltiples violaciones a la vez** — `validateTransfer` **acumula** todas las violaciones (monto, saldo, destinatario) en lugar de fallar en la primera, para dar feedback completo.
- **Consistencia tras éxito** — al confirmarse una transferencia se descuenta el saldo, se registra el movimiento y se invalidan las queries para que el Home refleje el nuevo estado de inmediato.

---

## 11. Qué haría diferente con más tiempo

- **Backend real + persistencia** — sustituir la capa `services`/API mock por servicios reales. La arquitectura ya lo permite **sin tocar el dominio ni la UI** (solo cambia la implementación de los servicios).
- **Estado serverless-safe** — reemplazar el estado en memoria de [`mocks/state.ts`](src/mocks/state.ts) por una DB/KV, para que múltiples instancias compartan estado y sobreviva a reinicios.
- **Idempotencia persistente** — el servidor ya deduplica por clave, pero el registro vive en memoria (se reinicia con el server); persistirlo en una tabla con índice único garantizaría *exactly-once* incluso entre reinicios e instancias.
- **Cobertura E2E e integración** — escribir tests E2E con Playwright (ya cableado) y tests de integración de red con `msw` (ya instalado) para los flujos completos login → transferencia → comprobante.
- **i18n** — hoy el formato está fijado a **es-MX / MXN**; extraer textos y locale para soportar varias regiones/monedas.
- **Auditoría de accesibilidad** — hay buenas bases (`aria-*`, `role="alert"`), pero faltaría una pasada formal (focus management del wizard, navegación por teclado, contraste).
- **Observabilidad** — telemetría y reporte de errores (p. ej. métricas de fallos de transferencia por escenario) para operar a alto volumen.

---

## 12. Cumplimiento del reto

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
| Rendering SSR/CSR/Server Actions justificado | [§3](#3-decisiones-de-renderizado-ssrcsr) (logout = Server Action) |
| Estado justificado | [§4](#4-gestión-de-estado) |
| Servicios con API Routes mock | [`src/app/api/`](src/app/api/) |
| Testing de validaciones/hooks/componentes | [§9](#9-componentes-reutilizables-estilos-y-testing) |

---
