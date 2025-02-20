import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import formatjs from 'eslint-plugin-formatjs';
import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/__generated__/*',
      'packages/app/src/relayArtifacts/',
      'packages/app/lib',
      'packages/app/ios',
      'packages/app/android',
      'packages/app/fastlane',
      'packages/app/vendor',
      'packages/data/lib',
      'packages/shared/lib',
      'packages/schema/lib',
      'packages/payment/lib',
      'packages/web/.next',
      'packages/backoffice/.next',
      '**/trash',
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:import/recommended',
      'plugin:import/typescript',
      'plugin:eslint-comments/recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'plugin:prettier/recommended',
    ),
  ),
  {
    plugins: {
      formatjs,
      'react-native': fixupPluginRules(reactNative),
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'array-callback-return': 'error',
      'no-promise-executor-return': 'error',
      'no-template-curly-in-string': 'error',
      'no-unreachable-loop': 'error',
      'no-unused-private-class-members': 'error',
      'consistent-this': 'error',
      eqeqeq: ['error', 'smart'],
      'func-name-matching': 'error',
      'func-names': 'error',
      'guard-for-in': 'error',
      'no-alert': 'error',
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-label-var': 'error',
      'no-lone-blocks': 'error',
      'no-lonely-if': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-return-assign': 'error',
      'no-return-await': 'error',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-escape': 'error',
      'no-useless-rename': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', 'never'],
      'prefer-arrow-callback': 'error',
      'prefer-const': 'error',
      'prefer-destructuring': [
        'error',
        {
          AssignmentExpression: {
            object: false,
            array: false,
          },
        },
      ],

      'prefer-promise-reject-errors': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      radix: 'error',

      'import/order': [
        'error',
        {
          pathGroups: [
            {
              pattern: '@azzapp/**',
              group: 'internal',
            },
            {
              pattern: '#**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '#**/**',
              group: 'internal',
              position: 'after',
            },
          ],

          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],

          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },

          pathGroupsExcludedImportTypes: ['type'],
        },
      ],

      'import/namespace': 'off',
      'import/no-unresolved': 'off',
      'import/no-named-as-default': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'eslint-comments/disable-enable-pair': 'off',
      'react/self-closing-comp': 2,
      'react-hooks/rules-of-hooks': 'error',
      'react/no-unknown-property': [
        2,
        {
          ignore: ['jsx'],
        },
      ],
      'formatjs/enforce-description': 'error',
      'formatjs/enforce-default-message': 'error',
      'formatjs/enforce-placeholders': 'error',
      'formatjs/no-multiple-whitespaces': 'error',
      'react/jsx-boolean-value': 'warn',
      'react/jsx-curly-brace-presence': 'warn',
      'react-native/no-unused-styles': 2,
      'react-native/no-single-element-style-arrays': 2,
    },
  },
  ...fixupConfigRules(
    compat.extends(
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
    ),
  ).map(config => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  {
    files: ['**/*.ts', '**/*.tsx'],

    rules: {
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array-simple',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/default-param-last': 'error',
      '@typescript-eslint/no-confusing-non-null-assertion': 'error',
      'no-dupe-class-members': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-invalid-this': 'error',
      '@typescript-eslint/no-invalid-void-type': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
      '@typescript-eslint/no-this-alias': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      '@typescript-eslint/sort-type-constituents': 'error',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: [
      'packages/web/**/*.ts',
      'packages/web/**/*.tsx',
      'packages/schema/**/*.ts',
      'packages/schema/**/*.tsx',
    ],
    rules: {
      'formatjs/enforce-id': [
        'error',
        {
          idInterpolationPattern: '[sha1:contenthash:base64:6]',
        },
      ],
    },
  },
  {
    files: ['packages/app/**/*.ts', 'packages/app/**/*.tsx'],
    rules: {
      'formatjs/no-id': 'error',
    },
  },
];
