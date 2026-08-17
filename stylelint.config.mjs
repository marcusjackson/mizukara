/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-recommended-vue'],
  plugins: ['stylelint-order'],
  ignoreFiles: ['dist/**/*', 'node_modules/**/*'],
  rules: {
    // Property ordering (concentric pattern: outside-in)
    'order/properties-order': [
      // Positioning
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      // Display & Box Model
      'display',
      'flex',
      'flex-direction',
      'flex-wrap',
      'flex-flow',
      'flex-grow',
      'flex-shrink',
      'flex-basis',
      'justify-content',
      'align-items',
      'align-content',
      'align-self',
      'order',
      'grid',
      'grid-template',
      'grid-template-columns',
      'grid-template-rows',
      'grid-template-areas',
      'grid-gap',
      'gap',
      'row-gap',
      'column-gap',
      // Box Model
      'box-sizing',
      'width',
      'min-width',
      'max-width',
      'height',
      'min-height',
      'max-height',
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'overflow',
      'overflow-x',
      'overflow-y',
      // Border
      'border',
      'border-width',
      'border-style',
      'border-color',
      'border-top',
      'border-right',
      'border-bottom',
      'border-left',
      'border-radius',
      // Background
      'background',
      'background-color',
      'background-image',
      'background-position',
      'background-size',
      'background-repeat',
      // Typography
      'color',
      'font',
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'line-height',
      'letter-spacing',
      'text-align',
      'text-decoration',
      'text-transform',
      'white-space',
      'word-break',
      'word-wrap',
      // Visual
      'opacity',
      'visibility',
      'box-shadow',
      'cursor',
      'outline',
      // Transitions & Animations
      'transition',
      'transform',
      'animation'
    ],

    // Enforce CSS variables for colors (disallow hardcoded colors)
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      'rgb',
      'rgba',
      'hsl',
      'hsla',
      'oklch',
      'lch',
      'lab',
      'color-mix'
    ],

    // Allow var() for colors, spacing, and typography
    'declaration-property-value-allowed-list': {
      '/color$/': [
        String.raw`/^var\(--/`,
        'transparent',
        'inherit',
        'currentColor'
      ],
      '/background$/': [
        String.raw`/^var\(--/`,
        'transparent',
        'inherit',
        'none'
      ],
      'background-color': [String.raw`/^var\(--/`, 'transparent', 'inherit'],
      'border-color': [
        String.raw`/^var\(--/`,
        'transparent',
        'inherit',
        'currentColor'
      ],
      'box-shadow': [String.raw`/^var\(--/`, 'none', 'inherit'],
      // Spacing: each token must be 0, -1px, auto, inherit, or a CSS variable.
      // The regex supports one-to-four space-separated shorthand tokens.
      padding: [
        String.raw`/^(0|-1px|auto|inherit|var\(--[^)]*\))(\s+(0|-1px|auto|inherit|var\(--[^)]*\)))*$/`
      ],
      margin: [
        String.raw`/^(0|-1px|auto|inherit|var\(--[^)]*\))(\s+(0|-1px|auto|inherit|var\(--[^)]*\)))*$/`
      ],
      // Typography: enforce design tokens for font properties (single-value)
      'font-size': [String.raw`/^var\(--/`, 'inherit', 'initial', 'unset'],
      'font-weight': [
        String.raw`/^var\(--/`,
        'inherit',
        'initial',
        'unset',
        'normal',
        'bolder',
        'lighter'
      ],
      'line-height': [
        String.raw`/^var\(--/`,
        'inherit',
        'initial',
        'normal',
        'unset'
      ]
    },

    // Allow CSS custom properties (variables)
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['/^--/']
      }
    ],

    // Selector naming (kebab-case with BEM support for classes)
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      {
        message: 'Class selectors should be kebab-case (BEM modifiers allowed)'
      }
    ],

    // Vue-specific
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'global', 'slotted']
      }
    ],
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['v-deep', 'v-global', 'v-slotted']
      }
    ],

    // Disable some rules that conflict with project conventions
    'no-empty-source': null,
    'no-descending-specificity': null,
    'declaration-empty-line-before': null
  },
  overrides: [
    {
      files: ['src/styles/tokens.css'],
      rules: {
        // Allow hardcoded values only in tokens file
        'color-no-hex': null,
        'function-disallowed-list': null,
        'declaration-property-value-allowed-list': null
      }
    }
  ]
}
