# 💳 Wallet App

Simulación de una wallet financiera construida con **Next.js 16 + TypeScript**, como solución a un challenge de frontend senior. Implementa un flujo completo de Login → Home → Nueva Transacción → Confirmación/Comprobante con datos mockeados, sin backend real.

---

## Índice

1. [Inicio rápido](#inicio-rápido)
2. [Scripts disponibles](#scripts-disponibles)
3. [Arquitectura general](#arquitectura-general)
4. [Decisiones técnicas](#decisiones-técnicas)
   - [Framework y rendering](#framework-y-rendering)
   - [Estilos: SCSS Modules](#estilos-scss-modules)
   - [Estado: dos herramientas, dos responsabilidades](#estado-dos-herramientas-dos-responsabilidades)
   - [Validación: Zod + React Hook Form](#validación-zod--react-hook-form)
   - [Cliente HTTP tipado](#cliente-http-tipado)
   - [Dinero como entero (Cents)](#dinero-como-entero-cents)
5. [Arquitectura por capas](#arquitectura-por-capas)
   - [Capa de dominio](#capa-de-dominio)
   - [Capa de infraestructura](#capa-de-infraestructura)
   - [Capa de aplicación](#capa-de-aplicación)
   - [Capa de presentación](#capa-de-presentación)
6. [Estructura de carpetas](#estructura-de-carpetas)
7. [Patrones de diseño implementados](#patrones-de-diseño-implementados)
8. [Buenas prácticas aplicadas](#buenas-prácticas-aplicadas)
9. [Flujo de navegación](#flujo-de-navegación)
10. [API Mock](#api-mock)
11. [Reglas de negocio](#reglas-de-negocio)
12. [Manejo de errores](#manejo-de-errores)
13. [Testing](#testing)
14. [Consideraciones de escala](#consideraciones-de-escala)

---

## Inicio rápido

### Prerequisitos

- **Node.js** `>= 20.9` ([ver requisito oficial](https://nextjs.org/docs/app/getting-started/installation))
- **npm** `>= 10`

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/wallet-app.git
cd wallet-app

# 2. Instalar dependencias
npm install

# 3. Levantar el servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### Credenciales de prueba

La autenticación es mockeada. Cualquier valor que cumpla el formato es válido:

| Tipo | Ejemplo |
|------|---------|
| Email | `usuario@ejemplo.com` |
| Teléfono | `+5213121234567` |

El sistema autentica siempre con el usuario **Carlos Mendoza** y un saldo de **$2,487.50 MXN**.

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo con Turbopack
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # ESLint
npm run format       # Prettier sobre todo el proyecto
npm test             # Tests unitarios con Vitest (single run)
npm run test:watch   # Tests en modo watch
npm run test:coverage # Reporte de cobertura
npm run test:e2e     # Tests E2E con Playwright
```

---

## Arquitectura general

El proyecto sigue una **arquitectura modular por feature con capas (clean-lite)**. La idea central es que cada feature es un módulo autónomo con sus propias capas internas, y las capas no se saltan: la presentación nunca habla con la infraestructura directamente.

```
┌─────────────────────────────────────────────────────┐
│                   PRESENTACIÓN                      │
│         Componentes React · Pages · Layouts         │
├─────────────────────────────────────────────────────┤
│                   APLICACIÓN                        │
│         Hooks · Stores · Casos de uso               │
├─────────────────────────────────────────────────────┤
│                    DOMINIO                          │
│    Tipos · Reglas de negocio · Schemas · Mappers    │
├─────────────────────────────────────────────────────┤
│                 INFRAESTRUCTURA                     │
│       HTTP Client · Route Handlers · Mocks          │
└─────────────────────────────────────────────────────┘
```

**La regla de dependencia:** las capas superiores dependen de las inferiores, nunca al revés. El dominio no importa nada de React ni de Next.js — es TypeScript puro y testeable en aislamiento.

---

## Decisiones técnicas

### Framework y rendering

**Next.js 16 con App Router.** La elección de App Router sobre Pages Router se basa en tres ventajas concretas para este proyecto:

1. **Server Components** permiten ejecutar lógica en el servidor sin enviar JavaScript al cliente. El layout del grupo `(app)` (`src/app/(app)/layout.tsx`) es un Server Component que lee la cookie de sesión con `cookies()`, valida su expiración y redirige antes de renderizar — el gate de autenticación ocurre en el servidor, no en el cliente.
2. **Layouts anidados** con grupos de rutas `(auth)` y `(app)` permiten separar la estructura de login del área protegida sin afectar las URLs.
3. **`error.tsx` / `loading.tsx` / `not-found.tsx`** por ruta convierten el manejo de estados en convención del framework, no código custom.

**Turbopack** como bundler por defecto (estable desde Next.js 16). Arranque en < 1 segundo en desarrollo, HMR prácticamente instantáneo.

**Estrategia de rendering combinada, justificada por capa:**

| Pantalla / capa | Estrategia | Justificación |
|----------|-----------|---------------|
| Login | Static (prerender) | Sin datos personalizados ni SEO; el formulario es puramente interactivo. |
| Layout `(app)` | **SSR** (Server Component) | Lee la cookie, gatea la autenticación y valida la expiración antes de enviar JS de cliente. Hace `/` y `/transfer` dinámicos (server-rendered on demand). |
| Home (datos) | CSR + React Query | Saldo, movimientos y contactos: datos por-usuario, auth-gated y que cambian seguido. React Query da cache, revalidación y estados loading/error. |
| Transfer (wizard) | CSR puro | Interactividad en tiempo real; nada que pre-renderizar. |
| Confirmación | CSR | El resultado viene de una mutación. |

> **Por qué este split (ni full-SSR ni full-CSR):** SSR se usa donde aporta — el *boundary* de autenticación (gate + identidad resueltos en el servidor). Los datos personalizados y cambiantes van en CSR + React Query: SSR-earlos significaría renderizar y fetchear en el servidor en *cada* request por datos que el cliente igual revalida, subiendo costo y TTFB sin ganancia real (no hay SEO detrás de auth). La única mejora combinada pendiente —**opcional**— sería prefetchear el **saldo** en el servidor (RSC + `HydrationBoundary`) para eliminar el waterfall del dato más crítico above-the-fold, dejando movimientos y contactos en cliente. Full SSR del wizard o de las listas sería sobre-ingeniería para este caso.

---

### Estilos: SCSS Modules

**Decisión:** SCSS Modules sobre styled-components o Tailwind CSS.

La razón principal es **arquitectónica, no estética**: styled-components entró en modo mantenimiento en marzo 2025 y su propio autor desaconseja su uso en proyectos nuevos. Más crítico aún: styled-components depende de la Context API de React, que **no funciona en Server Components sin marcar todo como `'use client'`**. Esto obligaría a degradar la estrategia de rendering.

SCSS Modules resuelve exactamente las mismas necesidades (scoping, variables, nesting, co-locación) con **cero runtime** — los estilos se extraen a CSS estático en build time. Esto es coherente con el contexto de "millones de usuarios" donde cada KB de JavaScript importa.

Tailwind CSS se descartó como preferencia personal: la familiaridad con SCSS produce código más mantenible en este contexto que clases utilitarias.

**Organización del sistema de estilos:**

```
src/styles/
├── _tokens.scss    # Design tokens como CSS custom properties
├── _mixins.scss    # Breakpoints, focus ring, app-container
└── globals.scss    # Reset + tokens aplicados al :root
```

Los tokens son **CSS custom properties** (`var(--color-primary-600)`), no variables de SCSS, para que estén disponibles en runtime (útil para temas futuros) y sean inspeccionables en DevTools.

---

### Estado: dos herramientas, dos responsabilidades

La decisión más importante de arquitectura de estado es **no usar una sola librería para todo**. Hay dos tipos de estado con naturalezas distintas:

#### Estado de servidor → TanStack Query (React Query)

Todo lo que viene de la API: saldo, movimientos, contactos. React Query no es solo un fetcher — es un **gestor de caché con sincronización**. Provee `isLoading / isError / refetch`, retry automático, staleTime configurable, e `invalidateQueries` para refrescar el Home después de una transferencia exitosa.

Usar Context + `useEffect` + `useState` para esto sería reinventar caché de forma peor.

#### Estado de UI efímero → Zustand

El wizard de transferencia (paso actual, monto seleccionado, contacto, outcome) vive en un store de Zustand. Es estado que:
- No viene del servidor
- Necesita sobrevivir navegación entre pasos
- Se resetea al **salir** del flujo (unmount de la página), para que cada entrada arranque limpia

Zustand sobre Redux Toolkit: el alcance del estado no justifica la ceremonia de RTK (actions, reducers, slices, middleware). Zustand es más simple, tipado nativo, y fácil de testear.

**La regla mental que gobierna la separación:**
> Nada que venga del servidor vive en Zustand. Nada de UI efímera vive en React Query.

---

### Validación: Zod + React Hook Form

**Una sola definición, dos usos:**

```ts
// El schema es la fuente única de verdad
export const loginSchema = z.object({ ... });

// El tipo se infiere del schema, no se escribe a mano
export type LoginFormValues = z.infer<typeof loginSchema>;
```

El mismo schema de Zod valida en el formulario (cliente) y en el route handler (servidor). No hay duplicación de lógica de validación.

**React Hook Form** sobre formularios controlados: inputs no controlados con registro por referencia. Mínimos re-renders durante la escritura — relevante cuando hay formularios con múltiples campos en dispositivos de gama baja.

**Separación explícita entre Zod y reglas de negocio:**

| Responsabilidad | Herramienta | Por qué |
|----------------|-------------|---------|
| Formato/estructura (¿es un número? ¿tiene el formato correcto?) | Zod schema | Validación estática, sin contexto runtime |
| Invariantes de negocio (¿hay saldo suficiente?) | Funciones puras en `domain/rules.ts` | Necesitan contexto runtime (saldo actual) |

`balanceIsSufficient(amount, balance)` **no puede ser un schema de Zod** porque el saldo disponible es estado runtime, no algo que un schema estático pueda conocer.

---

### Cliente HTTP tipado

`src/core/http/client.ts` es un wrapper de `fetch` con tres responsabilidades:

1. **Timeout via `AbortController`**: configurable por endpoint, 10 segundos por defecto. El endpoint de transfer usa 12 segundos para dar margen al mock de delay.
2. **Tipado genérico**: `httpClient<T>(url, options)` retorna `Promise<T>`, eliminando casteos en los consumers.
3. **Normalización de errores** a tres clases tipadas: `HttpError`, `NetworkError`, `TimeoutError`. Los consumers nunca manejan errores HTTP crudos — el mapper los convierte al `TransferOutcome` del dominio.
4. **Preservación del body de error**: `HttpError` conserva el body JSON ya parseado (`error.body`), de modo que el mapper pueda extraer campos estructurados del error (p. ej. `available`/`requested` en fondos insuficientes) con narrow seguro vía Zod — sin `as any` ni perder datos por el camino.

---

### Dinero como entero (Cents)

**El dinero nunca se modela como `float` en un sistema financiero.**

```ts
// ❌ Nunca
const total = 0.1 + 0.2; // 0.30000000000000004

// ✅ Siempre
const total = addCents(cents(10), cents(20)); // 30 (centavos exactos)
```

`Cents` es un **branded type**: a nivel de tipos no es asignable desde un `number` crudo. El compilador rechaza pasar dinero sin validar, haciendo imposible confundir "150 pesos" con "150 centavos" por error.

El parseo de input de usuario (`"150.50"` → `15050`) se hace por manipulación de strings, nunca con `parseFloat(x) * 100`.

Display con `Intl.NumberFormat` (locale `es-MX`, currency `MXN`) — centralizado en `formatMoney()`, una sola línea para cambiar moneda o locale.

---

## Arquitectura por capas

### Capa de dominio

`src/core/` y `src/features/*/domain/`

**Sin dependencias de React, Next.js, ni librerías externas.** Solo TypeScript puro.

Contiene:
- **Tipos de dominio**: `User`, `Session`, `Account`, `Movement`, `Contact`, `Receipt`, `TransferOutcome`
- **Reglas de negocio**: `validateTransfer()`, `amountIsPositive()`, `balanceIsSufficient()`, `hasRecipient()`
- **Módulo de dinero**: `Cents`, `parseAmountToCents()`, `formatMoney()`
- **Tipo `Result<T,E>`**: para errores explícitos sin `throw` en boundaries
- **Schemas Zod**: `loginSchema`, `amountSchema`, `newContactSchema`
- **Mappers**: `mapToTransferOutcome()` — normaliza HTTP a dominio

Esta capa es la más testeada y la que más valor tiene en un sistema financiero. Un cambio de framework no la afecta.

### Capa de infraestructura

`src/core/http/` y `src/app/api/`

Contiene el cliente HTTP y los route handlers mockeados. Es la única capa que habla HTTP. Los consumers solo ven tipos de dominio.

### Capa de aplicación

`src/features/*/hooks/` y `src/features/*/store/`

Orquesta dominio + infraestructura para los casos de uso concretos: `useLogin`, `useAccount`, `useMovements`, `useContacts`, `useTransfer`. Son hooks de React — la única dependencia de React en esta capa.

### Capa de presentación

`src/app/` y `src/features/*/components/` y `src/components/ui/`

Componentes React puros de presentación. No llaman a `fetch` directamente — consumen hooks de la capa de aplicación.

---

## Estructura de carpetas

```
wallet-app/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Route group sin layout propio
│   │   │   └── login/
│   │   │       ├── page.tsx          # Pantalla de login (CSR)
│   │   │       └── page.module.scss
│   │   ├── (app)/                    # Route group área protegida
│   │   │   ├── layout.tsx            # Server Component: gate de auth + hidratación de sesión
│   │   │   ├── page.tsx              # Home
│   │   │   ├── page.module.scss
│   │   │   └── transfer/
│   │   │       ├── page.tsx          # Wizard de transferencia
│   │   │       └── page.module.scss
│   │   ├── api/                      # Route Handlers (API Mock)
│   │   │   ├── session/route.ts      # POST /api/session
│   │   │   ├── account/route.ts      # GET /api/account
│   │   │   ├── movements/route.ts    # GET /api/movements
│   │   │   ├── contacts/route.ts     # GET/POST /api/contacts
│   │   │   └── transfer/route.ts     # POST /api/transfer
│   │   ├── layout.tsx                # Root layout + Providers
│   │   └── globals.scss              # (no usado, ver src/styles/)
│   │
│   ├── core/                         # Utilidades transversales
│   │   ├── result/index.ts           # Tipo Result<T,E>
│   │   ├── money/index.ts            # Cents, parseo, formato
│   │   ├── api/contracts.ts          # Contratos de la API (tipos wire)
│   │   └── http/client.ts            # fetch wrapper tipado
│   │
│   ├── features/                     # Módulos por dominio de negocio
│   │   ├── auth/
│   │   │   ├── domain/types.ts       # User, Session
│   │   │   ├── schema.ts             # loginSchema
│   │   │   ├── session.ts            # Cookie helpers
│   │   │   ├── store.ts              # Zustand auth store
│   │   │   ├── components/
│   │   │   │   └── AuthHydrator.tsx  # Siembra la sesión del servidor en el store (cliente)
│   │   │   └── hooks/
│   │   │       └── useLogin.ts
│   │   ├── wallet/
│   │   │   ├── domain/types.ts       # Account, Movement
│   │   │   ├── services.ts           # fetchAccount, fetchMovements
│   │   │   ├── hooks/
│   │   │   │   ├── useAccount.ts
│   │   │   │   └── useMovements.ts
│   │   │   └── components/
│   │   │       ├── BalanceCard/
│   │   │       └── MovementsList/
│   │   │           └── MovementItem/
│   │   └── transactions/
│   │       ├── domain/
│   │       │   ├── types.ts          # Contact, TransferOutcome, Receipt
│   │       │   ├── rules.ts          # Reglas de negocio puras
│   │       │   └── mappers.ts        # HTTP → TransferOutcome
│   │       ├── schema.ts             # amountSchema, newContactSchema
│   │       ├── services.ts           # fetchContacts, submitTransfer
│   │       ├── store/
│   │       │   └── transferStore.ts  # Zustand wizard store
│   │       ├── hooks/
│   │       │   ├── useContacts.ts
│   │       │   └── useTransfer.ts
│   │       └── components/
│   │           ├── AmountStep/
│   │           ├── ContactStep/
│   │           ├── SummaryStep/
│   │           └── ResultStep/
│   │
│   ├── components/
│   │   └── ui/                       # Primitivos reutilizables
│   │       ├── Button/
│   │       ├── Input/
│   │       ├── Card/
│   │       └── Skeleton/
│   │
│   ├── lib/
│   │   └── providers.tsx             # QueryClientProvider
│   │
│   ├── mocks/
│   │   ├── data.ts                   # Datos mockeados
│   │   └── utils.ts                  # Delays, IDs, escenarios aleatorios
│   │
│   ├── styles/
│   │   ├── _tokens.scss              # Design tokens → CSS custom properties
│   │   ├── _mixins.scss              # Breakpoints, focus-ring, app-container
│   │   └── globals.scss              # Reset + tokens en :root
│   │
│   ├── tests/
│   │   ├── setup.ts                  # @testing-library/jest-dom
│   │   ├── unit/
│   │   │   ├── domain/               # money, rules, schemas, mappers
│   │   │   └── components/           # Button, Input
│   │   └── e2e/                      # Playwright
│   │
│   └── middleware.ts                 # Protección de rutas por cookie
│
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── .prettierrc
└── package.json
```

---

## Patrones de diseño implementados

### Feature-based modularity

El código se organiza por **dominio de negocio**, no por tipo de archivo. Todo lo de `auth` está junto, todo lo de `transactions` está junto. Escala con equipos grandes: un equipo puede ser dueño de un feature sin tocar los demás.

```
# ❌ Organización por tipo (no escala)
components/LoginForm.tsx
components/BalanceCard.tsx
hooks/useLogin.ts
hooks/useAccount.ts

# ✅ Organización por feature
features/auth/components/LoginForm.tsx
features/auth/hooks/useLogin.ts
features/wallet/components/BalanceCard.tsx
features/wallet/hooks/useAccount.ts
```

### Discriminated Union para outcomes

`TransferOutcome` es una unión discriminada que mapea 1:1 con los 5 escenarios del reto:

```ts
type TransferOutcome =
  | { status: 'success'; receipt: Receipt }
  | { status: 'insufficient_funds'; available: Cents; requested: Cents }
  | { status: 'network_error' }
  | { status: 'timeout' }
  | { status: 'unknown_error' };
```

El `switch` en `ResultStep` es **exhaustivo** — el compilador fuerza manejar cada caso. Agregar un nuevo escenario rompe la compilación hasta que se maneja en la UI. Es imposible olvidar un caso.

### Result type para errores explícitos

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Las funciones que pueden fallar por razones esperadas (parseo, validación) retornan `Result` en lugar de lanzar excepciones. Obliga al caller a manejar ambos casos. El flujo de error es visible en los tipos, no escondido en `try/catch`.

### Mapper pattern

`mapToTransferOutcome()` es el único lugar donde se traduce HTTP (status codes, errores de red, timeouts) al dominio. Los componentes nunca ven HTTP — solo ven `TransferOutcome`. Cambiar el protocolo de transporte no afecta la UI.

### Códigos de error centralizados (enum)

Los códigos de error que cruzan la frontera servidor↔cliente viven en un solo enum, `ApiErrorCode` (`core/api/contracts.ts`), en lugar de strings mágicos duplicados entre los route handlers y el mapper:

```ts
export enum ApiErrorCode {
  InsufficientFunds = 'INSUFFICIENT_FUNDS',
  ValidationError = 'VALIDATION_ERROR',
  // ...
}
```

Fuente única de verdad: un typo entre servidor y cliente deja de ser posible y renombrar un código es un solo lugar. **Frontera deliberada:** el enum aplica solo a los códigos de *transporte*. Las uniones discriminadas de *dominio* (`TransferOutcome.status`, `TransferViolation.code`) se quedan como string-literals — es el patrón idiomático para un `switch` exhaustivo y no cruzan la red.

### Compound Component (wizard)

El wizard de transferencia es un **state machine implícita** con 4 estados (`amount → contact → summary → result`). El store de Zustand centraliza el estado y las transiciones. La página de transfer solo renderiza el paso activo — cada paso es un componente independiente sin conocimiento de los otros. Al desmontarse la página se llama `reset()`, así re-entrar al flujo (incluso con back/forward del navegador) siempre empieza en `amount` sin datos stale.

### Branded Types

```ts
declare const CENTS_BRAND: unique symbol;
type Cents = number & { readonly [CENTS_BRAND]: never };
```

Previene pasar un `number` crudo donde se espera dinero validado. El compilador detecta el error antes del runtime. Es el patrón correcto para modelar valores con invariantes fuertes.

### Defense in depth (doble validación)

Las reglas de negocio se aplican en **dos lugares**:

1. **Cliente**: feedback inmediato de UX, sin round-trip al servidor
2. **Servidor (route handler)**: autoridad real, no confiamos solo en el cliente

La misma función pura `validateTransfer()` se invoca en ambos lados. Una sola definición, dos puntos de aplicación.

---

## Buenas prácticas aplicadas

### TypeScript strict

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true
}
```

`noUncheckedIndexedAccess` hace que `array[0]` retorne `T | undefined` en lugar de `T`, eliminando una clase entera de runtime crashes. `exactOptionalPropertyTypes` diferencia entre una propiedad ausente y una propiedad con valor `undefined`.

### Co-locación de estilos

Cada componente tiene su `.module.scss` en la misma carpeta. El código y sus estilos viajan juntos — facilita refactors y elimina estilos huérfanos.

### typedRoutes

```ts
// next.config.ts
experimental: { typedRoutes: true }
```

`href` en `<Link>` es type-safe. El compilador rechaza un typo en un path o un link a una ruta que no existe.

### Idempotencia en mutaciones

El endpoint de transfer recibe un `idempotencyKey` generado en cliente. En un sistema real, previene dobles cargos cuando el cliente reintenta después de un timeout. El contrato lo incluye aunque el mock no lo aplique estrictamente — demuestra conocimiento del problema real.

### Paginación por cursor

`MovementsResponse` incluye `nextCursor: string | null` aunque el mock retorne siempre `null`. El contrato ya soporta paginación — escalar a millones de movimientos no requeriría cambiar la interfaz.

### Accesibilidad base

- Todos los inputs tienen `id` + `label` asociado
- Errores de formulario con `role="alert"` y `aria-describedby`
- `aria-invalid` en inputs con error
- Focus ring visible con `:focus-visible` (no en clicks, sí en teclado)
- Botones siempre con texto descriptivo

### Singleton de QueryClient

```ts
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient(); // server: siempre nuevo
  if (!browserQueryClient) browserQueryClient = makeQueryClient(); // browser: singleton
  return browserQueryClient;
}
```

Evita el problema de múltiples instancias de QueryClient en hidratación con Server Components.

### Formatter de Intl como singleton

```ts
// Una sola instancia — instanciar Intl.NumberFormat es costoso
const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
```

Con millones de renders, instanciar el formatter por llamada sería medible en performance.

---

## Flujo de navegación

```
/login
  │
  │ POST /api/session (cookie wallet_session)
  │ middleware verifica cookie en cada request
  │
  ▼
/ (Home)
  │  GET /api/account  → BalanceCard
  │  GET /api/movements → MovementsList
  │
  │ click "Enviar dinero"
  ▼
/transfer
  ├── Step 1: AmountStep
  │     └── Valida formato (Zod) + reglas de negocio (domain/rules)
  ├── Step 2: ContactStep
  │     └── GET /api/contacts | POST /api/contacts (nuevo contacto)
  ├── Step 3: SummaryStep
  │     └── Muestra resumen antes de confirmar
  └── Step 4: ResultStep
        ├── ✅ success        → Comprobante con referencia
        ├── 💳 insufficient_funds → Error con saldo disponible
        ├── 📡 network_error  → Error con opción de reintentar
        ├── ⏱️ timeout         → Error con opción de reintentar
        └── ⚠️  unknown_error  → Fallback genérico
```

**Protección de rutas (dos capas):**

1. **Middleware (`middleware.ts`, Edge):** intercepta cada request y comprueba la *presencia* de la cookie. Sin cookie, cualquier ruta protegida redirige a `/login`; con sesión activa, `/login` redirige a `/`.
2. **Layout `(app)` (Server Component):** parsea la cookie real con `parseSessionCookie`, valida la expiración (`expiresAt`) y redirige si la sesión es inválida — defensa en profundidad sobre el middleware.

**Hidratación de sesión:** la cookie es la fuente de verdad en el servidor. El layout pasa la sesión a `AuthHydrator` (Client Component), que la siembra en el store de Zustand. Así la identidad del usuario sobrevive a un refresh duro (antes el store en memoria se reseteaba a `null` y el Home perdía el nombre). El logout limpia **ambos**: borra la cookie y llama `clearSession()` en el store.

---

## API Mock

Todos los endpoints viven en `src/app/api/` como Route Handlers de Next.js. Tienen delays simulados para hacer visibles los estados de carga.

| Método | Endpoint | Descripción | Delay |
|--------|----------|-------------|-------|
| `POST` | `/api/session` | Login mock. Valida formato con Zod, retorna sesión fija. | 1000ms |
| `GET` | `/api/account` | Saldo y datos del titular. | 600ms |
| `GET` | `/api/movements` | Lista de movimientos recientes. | 800ms |
| `GET` | `/api/contacts` | Lista de contactos. | 500ms |
| `POST` | `/api/contacts` | Crear nuevo contacto (persiste en memoria). | 600ms |
| `POST` | `/api/transfer` | Transferencia con outcome **aleatorio**. | 1200ms |

### Escenarios aleatorios del endpoint de transfer

El endpoint elige un escenario al azar con los siguientes pesos:

| Escenario | Probabilidad | HTTP Status |
|-----------|-------------|-------------|
| `success` | 50% | 200 |
| `network_error` | ~17% | 503 |
| `timeout` | ~17% | 408 (15s delay) |
| `unknown_error` | ~17% | 500 |

`insufficient_funds` se activa cuando el monto supera el saldo disponible (validación de negocio real).

---

## Reglas de negocio

Las tres reglas del reto se implementan como **funciones puras** en `src/features/transactions/domain/rules.ts`. Son la única autoridad y se aplican en cliente y servidor.

```ts
// Regla 1: monto mínimo
amountIsPositive(amount: Cents): boolean
// → false si amount <= 0

// Regla 2: saldo suficiente
balanceIsSufficient(amount: Cents, balance: Cents): boolean
// → false si amount > balance

// Regla 3: destinatario obligatorio
hasRecipient(recipient: Contact | null): recipient is Contact
// → false si recipient === null
```

`validateTransfer()` las agrega y acumula todas las violaciones en un array, dando feedback completo al usuario en lugar de mostrar un error a la vez.

### Por qué no están en Zod

`balanceIsSufficient` necesita el saldo disponible del servidor en tiempo de ejecución. Un schema de Zod es estático por definición — no puede acceder a estado runtime. La separación entre validación de estructura (Zod) y validación de negocio (domain/rules) es explícita y deliberada.

---

## Manejo de errores

### En el cliente HTTP

```
fetch() lanza   → NetworkError
AbortController → TimeoutError
response !ok    → HttpError(status, code, message)
```

### En los componentes

React Query expone `isError` y `refetch` — los componentes muestran su estado de error con opción de reintentar sin código de manejo de errores custom.

### En el wizard de transferencia

`mapToTransferOutcome()` normaliza cualquier resultado (éxito o error) al `TransferOutcome` del dominio. `ResultStep` hace un `switch` exhaustivo — cada uno de los 5 escenarios tiene su pantalla específica con mensaje claro y acción de recuperación. En `insufficient_funds`, los montos `available`/`requested` se extraen del body del error validándolo con Zod (`safeParse`); si el body llegara mal, caen a `cents(0)` de forma controlada (antes se descartaban y la pantalla mostraba $0.00).

### Boundaries por ruta

`error.tsx` en el nivel de ruta actúa como Error Boundary de React para errores inesperados no manejados. El usuario ve un mensaje de error en lugar de una pantalla en blanco.

---

## Testing

### Filosofía

Los tests cubren **lo que más valor tiene**, no lo que es más fácil de testear:

1. **Reglas de negocio puras**: `validateTransfer`, `amountIsPositive`, `balanceIsSufficient`, `hasRecipient` — son el corazón del dominio financiero.
2. **Módulo de dinero**: parseo sin imprecisión float, aritmética correcta de centavos.
3. **Schemas Zod**: todos los casos límite de validación de formato.
4. **Mapper de outcomes**: todos los escenarios de error mapean al `TransferOutcome` correcto.
5. **Componentes críticos**: `Button` con sus estados (loading, disabled, onClick).

### Stack

| Herramienta | Rol |
|-------------|-----|
| **Vitest** | Runner de tests unitarios. Sobre Jest por velocidad, ESM/TS nativo, casi cero config. |
| **React Testing Library** | Tests de componentes desde la perspectiva del usuario. |
| **@testing-library/user-event** | Simula interacciones reales (click, type). |
| **Playwright** | Tests E2E multi-navegador. |

### Cobertura de tests unitarios

```
src/tests/unit/
├── domain/
│   ├── money.test.ts      # parseAmountToCents, cents, formatMoney, aritmética
│   ├── rules.test.ts      # validateTransfer + las 3 reglas individuales
│   ├── schemas.test.ts    # loginSchema, amountSchema, newContactSchema
│   └── mappers.test.ts    # mapToTransferOutcome (7 casos: 5 escenarios + montos del body + body ausente)
└── components/
    └── Button.test.tsx    # render, loading, disabled, onClick
```

### Correr los tests

```bash
# Todos los tests
npm test

# Con cobertura (apuntada a domain/ y core/)
npm run test:coverage

# Modo watch durante desarrollo
npm run test:watch
```

---

## Consideraciones de escala

El reto especifica un contexto de **millones de usuarios activos**. Estas decisiones lo contemplan:

| Decisión | Impacto en escala |
|----------|------------------|
| **Server Components** | Menos JS enviado al cliente → mejor performance en dispositivos de gama baja |
| **Turbopack** | Build más rápido → deploys más frecuentes |
| **React Query con `staleTime`** | Evita re-fetches innecesarios → menos carga en el servidor |
| **Paginación por cursor en movimientos** | La lista no crece infinita en memoria |
| **Cents como entero** | Consistencia financiera a cualquier escala |
| **Idempotency key en transfer** | Previene dobles cargos en reintentos |
| **CSS Modules (zero runtime)** | Sin overhead de CSS-in-JS en cada render |
| **`Intl.NumberFormat` como singleton** | Una instancia compartida en lugar de una por render |
| **Middleware en Edge Runtime** | Protección de rutas sin cold start de Node |
| **Discriminated unions exhaustivas** | Nuevos escenarios rompen la compilación → no se pueden ignorar |

### Lo que se agregaría en producción real

- **Autenticación real**: JWT firmados, refresh tokens, rotación de cookies con `HttpOnly` + `Secure` + `SameSite=Strict`
- **Observabilidad**: Sentry para errores, OpenTelemetry para traces
- **Virtualización de listas**: `virtua` o `react-window` para listas de movimientos largas
- **React Compiler**: memoización automática verificada por el compilador
- **Internacionalización**: `next-intl` para múltiples monedas y locales
- **Rate limiting**: en los route handlers para prevenir abuso
- **HTTPS + CSP headers**: en `next.config.ts`