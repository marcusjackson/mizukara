import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys'
import vitest from 'eslint-plugin-vitest'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

// eslint-disable-next-line @typescript-eslint/no-deprecated
export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '*.min.js',
      'ignore/**',
      'specs/**', // Specification documentation - not runtime code
      '*.config.mjs' // Ignore plain JS/MJS config files
    ]
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Vue rules
  ...pluginVue.configs['flat/recommended'],

  // TypeScript parser options for all TS-like files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue']
      }
    }
  },

  // Import sorting plugin
  {
    plugins: {
      'simple-import-sort': simpleImportSort
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Vue imports
            ['^vue$', '^vue-router$'],
            // Third-party packages
            ['^@?\\w'],
            // Base imports (@/base/)
            ['^@/base/'],
            // API layer imports (@/api/)
            ['^@/api/'],
            // Shared imports (@/shared/)
            ['^@/shared/'],
            // Module/relative imports
            ['^@/', '^\\.\\./'],
            // Relative imports from same directory
            ['^\\./'],
            // Type imports
            ['^.*\\u0000$']
          ]
        }
      ],
      'simple-import-sort/exports': 'error'
    }
  },

  // Sort destructure keys plugin
  {
    plugins: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      'sort-destructure-keys': sortDestructureKeys
    },
    rules: {
      'sort-destructure-keys/sort-destructure-keys': 'error'
    }
  },

  // Import plugin for validating imports
  {
    plugins: {
      import: importPlugin
    },
    settings: {
      'import/resolver': 'typescript'
    },
    rules: {
      'import/no-unresolved': ['error', { ignore: ['^virtual:'] }]
    }
  },

  // Vitest rules for test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'test/**/*.ts'],
    plugins: {
      vitest
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
      'vitest/require-top-level-describe': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'warn',
      // Relax some TypeScript rules for tests
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off'
    }
  },

  // File size and complexity rules (new code only)
  // Order matters: more specific patterns must come before general patterns
  //
  // Note: skipBlankLines and skipComments are set to false to count actual file lines.
  // This makes limits simpler to understand and verify. Limits are set higher to account
  // for blank lines and comments (roughly +50 from the previous code-only limits).

  // Test files - most permissive (650 lines)
  // max-lines-per-function is disabled for test files because:
  // - describe() blocks naturally grow with comprehensive test coverage
  // - A repository test might have 20+ test cases, making 200+ line describe blocks normal
  // - The important metric is keeping individual it() callbacks short and focused
  // - Splitting describe blocks just to meet line limits reduces test cohesion
  // - This is standard practice in the testing community (Jest, Vitest, etc.)
  // - We still enforce max-lines (650) on the overall test file to prevent runaway growth
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'test/**/*.ts', 'e2e/**/*.ts'],
    rules: {
      'max-lines': [
        'error',
        { max: 600, skipBlankLines: true, skipComments: true }
      ],
      'max-lines-per-function': 'off',
      complexity: 'off'
    }
  },

  // Type files (300 lines)
  {
    files: ['**/*-types.ts'],
    rules: {
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true }
      ]
    }
  },

  // Section components (250 lines)
  {
    files: ['**/*Section*.vue'],
    rules: {
      'max-lines': [
        'error',
        { max: 250, skipBlankLines: true, skipComments: true }
      ]
    }
  },

  // Root components (250 lines)
  {
    files: ['**/*Root*.vue'],
    rules: {
      'max-lines': [
        'error',
        { max: 250, skipBlankLines: true, skipComments: true }
      ]
    }
  },

  // Composables (200 lines)
  {
    files: ['**/use-*.ts', '**/composables/use-*.ts'],
    ignores: ['**/*.test.ts', 'src/base/**'],
    rules: {
      'max-lines': [
        'error',
        { max: 200, skipBlankLines: true, skipComments: true }
      ]
    }
  },

  // Base composables (300 lines)
  {
    files: ['src/base/composables/use-*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true }
      ]
    }
  },

  // Repository files (250 lines)
  {
    files: ['**/api/**/*-repository.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      'max-lines': [
        'error',
        { max: 250, skipBlankLines: true, skipComments: true }
      ]
    }
  },

  // UI components (200 lines) - excluding Root, Section, Page, and Base
  {
    files: ['**/*.vue'],
    ignores: [
      '**/*Root*.vue',
      '**/*Section*.vue',
      '**/*Page.vue',
      'src/base/**' // Base components are generic primitives with higher limits
    ],
    rules: {
      'max-lines': [
        'error',
        { max: 225, skipBlankLines: true, skipComments: true }
      ]
    }
  },

  // Base components (450 lines) - generic primitives that work in any project
  // Higher limit because they are complete, self-contained components
  {
    files: ['src/base/components/**/*.vue'],
    rules: {
      'max-lines': [
        'error',
        { max: 450, skipBlankLines: true, skipComments: true }
      ]
    }
  },

  // Page components (100 lines) - thin route wrappers
  {
    files: ['**/*Page.vue'],
    rules: {
      'max-lines': [
        // Note: Test files are explicitly excluded - they have different requirements
        'error',
        { max: 100, skipBlankLines: true, skipComments: true }
      ]
    }
  },

  // General complexity rules for all TypeScript/Vue files
  {
    files: ['**/*.ts', '**/*.vue'],
    ignores: ['**/*.test.ts', '**/*.spec.ts', 'test/**/*.ts', 'e2e/**/*.ts'],
    rules: {
      'max-lines-per-function': [
        'error',
        { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true }
      ],
      complexity: ['error', { max: 15 }],
      'max-depth': ['warn', { max: 4 }],
      'max-nested-callbacks': ['warn', { max: 3 }],
      'max-params': ['warn', { max: 5 }]
    }
  },

  // Custom rules for all files
  {
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports'
        }
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // Vue
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/define-macros-order': [
        'error',
        {
          order: ['defineProps', 'defineEmits', 'defineSlots']
        }
      ],
      'vue/html-self-closing': [
        'error',
        {
          html: { void: 'always', normal: 'always', component: 'always' }
        }
      ],
      'vue/no-unused-refs': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/padding-line-between-blocks': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
      'vue/attributes-order': ['error', { alphabetical: true }],
      'vue/multi-word-component-names': 'off', // Allow single-word page components

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },

  // Script files (seed data, build scripts) - allow console.log
  // This must come AFTER the main rules to override them
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off'
    }
  },

  {
    languageOptions: {
      globals: {
        NodeJS: true
      }
    }
  },

  // Prettier (must be last to override other formatting rules)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  eslintConfigPrettier
)
