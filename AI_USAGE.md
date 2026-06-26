# Uso de IA en el desarrollo

Este documento explica **cómo usé IA** (Claude) durante el desarrollo: en qué partes me apoyé, qué acepté, qué corregí o rechacé, y qué decisiones tomé yo y no la herramienta.

La idea de fondo es simple: **la IA fue un acelerador, no el piloto.** Antes de escribir un solo prompt, lo más importante fue **entender el problema** qué queria resolver y cómo. Con el problema entendido y una **arquitectura ya decidida por mí**, la IA aporta velocidad dentro de esos límites, pero no toma las decisiones de fondo.

> El **qué** y el **porqué** técnico de cada decisión está en **[DECISIONS.md](DECISIONS.md)**. Este archivo cubre el **proceso**, no la implementación.

---

## Índice

1. [Herramientas utilizadas y en qué partes](#1-herramientas-utilizadas-y-en-qué-partes)
2. [Qué acepté, qué corregí y qué rechacé](#2-qué-acepté-qué-corregí-y-qué-rechacé)
3. [Decisiones que tomé yo, no la IA](#3-decisiones-que-tomé-yo-no-la-ia)
4. [Cómo trabajé con la IA (flujo)](#4-cómo-trabajé-con-la-ia-flujo)

---

## 1. Herramientas utilizadas y en qué partes

La única herramienta de IA fue **Claude**, usada en cuatro frentes distintos. La regla que me puse: usarla para **acelerar y contrastar**, siempre sobre decisiones que yo ya había tomado.

| Uso | Dónde en el proyecto | Detalle |
|-----|----------------------|---------|
| **Modelado de schemas (Zod)** | [`features/auth/schema.ts`](src/features/auth/schema.ts), [`features/transactions/schema.ts`](src/features/transactions/schema.ts) | Definición de los schemas de validación compartidos cliente↔servidor (login, monto, nuevo contacto, contrato de transferencia). |
| **Conversación de arquitectura y dependencias** | Estructura `core/` + `features/` + `components/ui/` | Discutir trade-offs de la estructura feature-driven, qué librería resolvía cada tipo de estado y qué dependencias **no** valían la pena. La decisión final fue mía (ver [§3](#3-decisiones-que-tomé-yo-no-la-ia)). |
| **Patrones de diseño** | [`core/result/index.ts`](src/core/result/index.ts), [`core/money/index.ts`](src/core/money/index.ts), [`domain/mappers.ts`](src/features/transactions/domain/mappers.ts), [`store/transferStore.ts`](src/features/transactions/store/transferStore.ts) | `Result<T, E>` estilo Rust, branded type `Cents`, unión discriminada `TransferOutcome` y el wizard modelado como máquina de estados. |
| **Investigación de buenas prácticas fintech y errores comunes** | [`domain/rules.ts`](src/features/transactions/domain/rules.ts), [`api/transfer/route.ts`](src/app/api/transfer/route.ts), [`core/http/client.ts`](src/core/http/client.ts) | Idempotencia para evitar doble cargo, validación **doble** (cliente y servidor), dinero en **enteros** (centavos) y manejo de timeouts con `AbortController`. |
| **Generación de código supervisada** | [`core/`](src/core/), [`components/ui/`](src/components/ui/), [`styles/`](src/styles/) | Borradores de lógica pura, componentes de presentación y estilos, siempre revisados antes de integrarse. |

---

## 2. Qué acepté, qué corregí y qué rechacé

### Acepté (con supervisión)

Acepté las propuestas de la IA donde el trabajo era de implementación dentro de límites que yo ya había fijado, revisando siempre el resultado:

- **Estilos** — los **SCSS Modules** y los design tokens ([`styles/_tokens.scss`](src/styles/_tokens.scss)).
- **Modelado y desarrollo del `core/`** — la lógica pura transversal (dinero, `Result`, cliente HTTP, contratos). Acepté apoyarme fuerte aquí **precisamente porque está aislado**: no depende de React ni de Next y es testeable de forma determinista, así que el riesgo de una mala sugerencia es acotado y verificable con tests.
- **Componentes de presentación** — los componentes tontos de [`components/ui/`](src/components/ui/), siempre bajo supervisión: la lógica vive en hooks/dominio, no en el componente.

### Corregí

- **El manejo del layout en `app/`.** El enfoque inicial no aprovechaba el renderizado en servidor. Lo corregí para que el grupo [`(app)/layout.tsx`](src/app/(app)/layout.tsx) sea un **Server Component** que lee la cookie de sesión con `cookies()` y actúa como **guard de servidor** (defensa en profundidad junto al middleware), hidratando luego el store del cliente vía [`AuthHydrator`](src/features/auth/components/AuthHydrator.tsx). Esta corrección **aprovecha mejor lo que ofrece Next** y demuestra ese conocimiento de SSR, que es parte de lo que evalúa el reto. El detalle está en [DECISIONS.md §3](DECISIONS.md#3-decisiones-de-renderizado-ssrcsr).

### Rechacé

- **Dependencias que llevaban a sobre-ingeniería**, en concreto **Redux Toolkit**. Para el alcance de esta app, añade boilerplate sin resolver nada que no esté ya cubierto: **React Query** gestiona el estado de servidor (caché, reintentos, invalidación), **Zustand** el poco estado de UI global, y **React Hook Form** los formularios. Cada herramienta hace lo que mejor resuelve, con menos código. El razonamiento completo está en [DECISIONS.md §4](DECISIONS.md#4-gestión-de-estado).

---

## 3. Decisiones que tomé yo, no la IA

Estas decisiones fueron mías; la IA, en todo caso, sirvió para contrastarlas, no para tomarlas:

- **Entender el problema primero.** Antes de cualquier prompt, definir qué se quería resolver y cómo. Ese fue el verdadero punto de partida; con el problema claro, hasta una arquitectura definida se ejecuta más rápido.
- **La arquitectura** (feature-driven + capa transversal `core`). La elegí pensando en un contexto de **millones de usuarios**: tenía que **escalar bien por features y por equipos** y ser **fácil de entender para alguien que entra nuevo**. Ver [DECISIONS.md §1](DECISIONS.md#1-por-qué-esta-estructura-feature-driven--core).
- **SCSS Modules en vez de Tailwind y de styled-components/CSS-in-JS.** SCSS aprovecha el manejo de estilos que ya ofrece Next sin penalizarlo, a diferencia del CSS-in-JS (runtime en cliente). Fue una decisión de criterio sobre el stack, no una sugerencia adoptada.
- **Las directivas de consistencia en [`AGENTS.md`](AGENTS.md).** Las escribí para fijar los invariantes del proyecto (dinero en `Cents`, reglas en un solo lugar, errores tipados, capas) y así **gobernar a la IA**: que cualquier código generado respete las mismas convenciones en todo el repo.
- **El criterio editorial** sobre cada sugerencia: qué aceptar, qué corregir y qué rechazar (la [§2](#2-qué-acepté-qué-corregí-y-qué-rechacé) completa). Ese filtro fue siempre humano.

---

## 4. Cómo trabajé con la IA (flujo)

El ciclo que seguí, en orden:

1. **Entender** el problema y los requisitos del reto.
2. **Diseñar la arquitectura** y elegir el stack (decisiones humanas).
3. **Usar la IA para acelerar** dentro de esos límites: schemas, lógica del `core/`, componentes de presentación, estilos e investigación de buenas prácticas.
4. **Revisar, corregir o rechazar** cada salida según criterio propio.
5. **Consolidar las convenciones en [`AGENTS.md`](AGENTS.md)** para que la IA mantuviera consistencia en todo el código a lo largo del desarrollo.
6. **Documentar y hacer commits** Me ayudo a crear mis commits mejor documentados con los cambios realizados 

En resumen: con el problema entendido y la arquitectura decidida, la IA fue una herramienta para ir más rápido y contrastar ideas, pero las decisiones de fondo —y el control de calidad— fueron míos.
