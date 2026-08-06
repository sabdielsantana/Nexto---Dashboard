---
name: components-build
description: Build modern, composable, and accessible React UI components following the components.build specification. Use when creating, reviewing, or refactoring component libraries, design systems, or any reusable UI components. Triggers on tasks involving component APIs, composition patterns, accessibility, styling systems, or TypeScript props.
license: MIT
metadata:
  author: components.build
  version: "1.0.0"
---

# Components.build Specification

Comprehensive guidelines for building modern, composable, and accessible UI components. Contains 16 rule categories covering everything from core principles to distribution, co-authored by Hayden Bleasel and shadcn.

## When to Apply

Reference these guidelines when:
- Creating new React components or component libraries
- Designing component APIs and prop interfaces
- Implementing accessibility features (keyboard, ARIA, focus management)
- Building composable component architectures
- Styling components with Tailwind CSS and CVA
- Publishing components to registries or npm

## Rule Categories by Priority

| Priority | Category | Focus | Prefix |
|----------|----------|-------|--------|
| 1 | Overview | Specification scope and goals | `overview` |
| 2 | Principles | Core design philosophy | `principles` |
| 3 | Definitions | Common terminology | `definitions` |
| 4 | Composition | Breaking down complex components | `composition` |
| 5 | Accessibility | Keyboard, screen readers, ARIA | `accessibility` |
| 6 | State | Controlled/uncontrolled patterns | `state` |
| 7 | Types | TypeScript props and interfaces | `types` |
| 8 | Polymorphism | Element switching with `as` prop | `polymorphism` |
| 9 | As-Child | Radix Slot composition pattern | `as-child` |
| 10 | Data Attributes | `data-state` and `data-slot` | `data-attributes` |
| 11 | Styling | Tailwind CSS, cn utility, CVA | `styling` |
| 12 | Design Tokens | CSS variables and theming | `design-tokens` |
| 13 | Documentation | Component documentation | `documentation` |
| 14 | Registry | Component registries | `registry` |
| 15 | NPM | Publishing to npm | `npm` |
| 16 | Marketplaces | Component marketplaces | `marketplaces` |

## Quick Reference

### 1. Overview
- `overview` - Specification scope, goals, and philosophy

### 2. Principles
- `principles` - Composability, accessibility, customization, transparency

### 3. Definitions
- `definitions` - Common terminology (primitive, compound, headless, etc.)

### 4. Composition
- `composition-root` - Root component with Context for shared state
- `composition-item` - Item wrapper components
- `composition-trigger` - Interactive trigger components
- `composition-content` - Content display components
- `composition-export` - Namespace export pattern

### 5. Accessibility
- `accessibility-semantic-html` - Use appropriate HTML elements
- `accessibility-keyboard` - Full keyboard navigation support
- `accessibility-aria` - Proper ARIA roles, states, and properties
- `accessibility-focus` - Focus management and restoration
- `accessibility-live-regions` - Screen reader announcements
- `accessibility-contrast` - Color contrast requirements

### 6. State
- `state-uncontrolled` - Internal state management
- `state-controlled` - External state delegation
- `state-controllable` - Support both patterns with useControllableState

### 7. Types
- `types-extend-html` - Extend native HTML attributes
- `types-export` - Export prop types for consumers
- `types-single-element` - One component wraps one element

### 8. Polymorphism
- `polymorphism-as-prop` - Change rendered element type
- `polymorphism-typescript` - Type-safe polymorphic components
- `polymorphism-defaults` - Semantic element defaults

### 9. As-Child
- `as-child-slot` - Radix Slot for prop merging
- `as-child-composition` - Compose with child components

### 10. Data Attributes
- `data-attributes-state` - Use `data-state` for styling states
- `data-attributes-slot` - Use `data-slot` for targeting sub-components

### 11. Styling
- `styling-cn-utility` - Combine clsx and tailwind-merge
- `styling-order` - Base → Variants → Conditionals → User overrides
- `styling-cva` - Class Variance Authority for variants
- `styling-css-variables` - Dynamic values with CSS variables

### 12. Design Tokens
- `design-tokens-css-variables` - Define tokens as CSS variables
- `design-tokens-theming` - Support light/dark modes and themes

### 13. Documentation
- `documentation-props` - Document all props with JSDoc
- `documentation-examples` - Provide usage examples

### 14. Registry
- `registry-structure` - Registry file structure
- `registry-schema` - Component metadata schema

### 15. NPM
- `npm-package-json` - Package configuration
- `npm-exports` - Module exports

### 16. Marketplaces
- `marketplaces-distribution` - Component distribution strategies

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/composition/SKILL.md
rules/accessibility/SKILL.md
rules/styling/SKILL.md
```

Each rule file contains:
- Brief explanation of why it matters
- Incorrect code example with explanation
- Correct code example with explanation
- Best practices and common pitfalls

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`

## Key Principles

1. **Composition over Configuration** - Break components into composable sub-components
2. **Accessibility by Default** - Not an afterthought, but a requirement
3. **Single Element Wrapping** - Each component wraps one HTML element
4. **Extend HTML Attributes** - Always extend native element props
5. **Export Types** - Make prop types available to consumers
6. **Support Both State Patterns** - Controlled and uncontrolled
7. **Intelligent Class Merging** - Use `cn()` utility with tailwind-merge

## Authors

Co-authored by:
- **Hayden Bleasel** ([@haydenbleasel](https://x.com/haydenbleasel))
- **shadcn** ([@shadcn](https://x.com/shadcn))

Adapted as an AI skill by:
- **Jordan Gilliam** ([@nolansym](https://x.com/nolansym))

Based on the [components.build](https://components.build) specification.

---

# Anexo del proyecto — Convención plana (Nexto)

> Esta sección la añade **este proyecto**. Todo lo anterior es el spec original
> de components.build, sin tocar. Cuando ambos se contradigan, **manda esta
> sección**, porque describe el código que ya existe en `components/ui/`.

## Regla

Todo componente que traigamos de cult-ui (o de cualquier registro externo) se
**aplana** a la convención de `components/ui/` antes de darlo por instalado.
No se consume tal cual viene.

### 1. Exports con nombre, nunca `export default`

```tsx
// ✅
export { NeumorphButton, neumorphButtonVariants };
export interface NeumorphButtonProps { … }

// ❌ como suele venir del registro
export default NeumorphButton;
```

### 2. Sin patrón namespace

Los subcomponentes se exportan planos, no colgados de un objeto. Esto
contradice `composition-export` y los ejemplos `Accordion.Root` de
`rules/composition.md`; aquí gana lo plano.

```tsx
// ✅ lo que ya hacen dialog.tsx, select.tsx, table.tsx…
export { Dialog, DialogTrigger, DialogContent, DialogTitle };

// ❌
export const Dialog = { Root, Trigger, Content };
```

### 3. Sin polimorfismo `as`

Nada de `<Button as="a">` ni genéricos polimórficos. Contradice
`rules/polymorphism.md` a propósito: complica los tipos y no lo necesitamos.
Si hace falta otro elemento, se compone (ver punto 4).

### 4. `asChild`: no se añade, pero no se arranca

Matiz importante, porque es fácil leer "convención plana" como "prohibido
`asChild`" y romper código que funciona:

- **No se lo añadimos** a los componentes que importemos de cult-ui. Llegan sin
  él y así se quedan.
- **Se mantiene donde ya está y se gana el sitio**, que hoy es:
  - `components/ui/button.tsx` — permite `<Button asChild><Link …></Button>`,
    que renderiza un `<a>` de verdad. Quitarlo rompería 7 usos y degradaría la
    accesibilidad (navegación por teclado, abrir en pestaña nueva).
  - Los `*Trigger` de Radix (`DialogTrigger`, `PopoverTrigger`,
    `DropdownMenuTrigger`, `AlertDialogTrigger`) — es el mecanismo de
    composición de Radix, no una elección de estilo nuestra. Unos 10 usos.

O sea: la regla es *no introducir* `asChild` nuevo, no erradicarlo.

### 5. Forma del componente

- `React.forwardRef` + `displayName`, no `React.FC`.
- Las clases pasan por `cn()` para que el `className` del consumidor gane los
  conflictos vía tailwind-merge (esto sí coincide con el spec).
- Los tipos de props se exportan y extienden los atributos nativos del
  elemento.

### 6. Colores por token, nunca hex fijo

Los componentes de registro suelen traer hex incrustados y por eso no
reaccionan al toggle claro/oscuro. Se reescriben contra los tokens del
proyecto (`--primary`, `--info`, `--positive`, `--negative`, `--warning`,
`--accent-alt`).

Para componer opacidad se usa `hsl(var(--token) / X)`, el mismo patrón que
`components/calendar/heatmap-calendar.tsx`. Los tokens se guardan como
tripletes HSL sin envolver justamente para permitirlo.

> Cuidado con Tailwind: las clases tienen que quedar **literales** en el
> código. Tailwind escanea el fuente como texto plano, así que una clase
> construida con plantillas (`` `shadow-[…${tinte}]` ``) no se genera nunca y
> el componente sale sin estilo, sin error en ningún sitio.

## Checklist al importar un componente

1. `export default` → export con nombre.
2. `React.FC` → `forwardRef` + `displayName`.
3. Hex fijos → tokens del proyecto.
4. Clases por `cn()`.
5. Sin `as` ni `asChild` nuevos; sin namespace.
6. `tsc --noEmit`, `next lint` y `next build`.
7. Si toca color, comprobar los dos temas de verdad, no solo que compile.

## Tinta sobre rellenos claros: `--on-bright`

Sobre `positive` y `warning` va `text-on-bright`, no `text-white`. El blanco
sobre esos verdes y naranjas se quedaba en 2.02:1 y 2.49:1 en oscuro, por
debajo incluso del 3:1 de texto grande; con `--on-bright` todas las
combinaciones pasan de 4.5:1.

`--on-bright` **no se redefine en `.dark`** a propósito: es tinta sobre un
relleno de color, no sobre el fondo de la página, así que no debe seguir al
tema.

Al traer un componente con rellenos saturados, comprobar el contraste midiendo
el color computado en el navegador, no a ojo. `negative`, `info` y `default`
sí funcionan con blanco y se quedan como están.
