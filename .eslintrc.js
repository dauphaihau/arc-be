module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:node/recommended',
    'plugin:security/recommended',
  ],
  plugins: ['@typescript-eslint', '@stylistic', 'import', 'promise'],
  rules: {
    'no-console': 'error',
    'func-names': 'off',
    'no-return-await': 'error',

    // plugin: stylistic
    '@stylistic/semi': ['error', 'always',
      {
        omitLastInOneLineBlock: true,
        omitLastInOneLineClassBody: true,
      },
    ],
    '@stylistic/indent': ['error', 2],
    '@stylistic/quotes': ['error', 'single'],
    '@stylistic/comma-dangle': ['error', {
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'never',
      exports: 'never',
      functions: 'never',
    }],
    '@stylistic/dot-location': ['error', 'property'],
    '@stylistic/array-bracket-spacing': ['error', 'never'],
    '@stylistic/linebreak-style': ['error', 'unix'],
    '@stylistic/max-statements-per-line': ['error', { max: 1 }],
    '@stylistic/max-len': ['error',
      {
        code: 100,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreComments: true,
      },
    ],
    '@stylistic/multiline-ternary': ['error', 'always-multiline'],
    '@stylistic/new-parens': 'error',
    '@stylistic/no-floating-decimal': 'error',
    '@stylistic/no-mixed-operators': 'error',
    '@stylistic/no-mixed-spaces-and-tabs': 'error',
    '@stylistic/no-whitespace-before-property': 'error',
    '@stylistic/no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],
    '@stylistic/no-multi-spaces': 'error',
    '@stylistic/object-curly-newline': ['error', {
      multiline: true,
      minProperties: 4,
      consistent: true,
    }],
    '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    '@stylistic/object-curly-spacing': ['error', 'always'],
    '@stylistic/one-var-declaration-per-line': ['error', 'initializations'],
    '@stylistic/operator-linebreak': ['error', 'after'],
    '@stylistic/quote-props': ['error', 'as-needed'],
    '@stylistic/space-before-blocks': 'error',
    '@stylistic/space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always',
    }],
    '@stylistic/space-in-parens': ['error', 'never'],
    '@stylistic/type-annotation-spacing': 'error',

    // plugin: import
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type',
        ],
      },
    ],

    // plugin: node/recommended
    'node/exports-style': ['error', 'module.exports'],
    'node/file-extension-in-import': 'off',
    'node/no-missing-import': 'off',
    'node/prefer-global/buffer': ['error', 'always'],
    'node/prefer-global/console': ['error', 'always'],
    'node/prefer-global/process': ['error', 'always'],
    'node/prefer-global/url-search-params': ['error', 'always'],
    'node/prefer-global/url': ['error', 'always'],
    'node/prefer-promises/dns': 'error',
    'node/prefer-promises/fs': 'error',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-extraneous-import': 'off',
    'node/no-unsupported-features/es-builtins': 'off',
    'node/no-unpublished-import': ['error', {
      allowModules: ['@faker-js/faker', 'vitest'],
    }],

    // plugin: promise
    'promise/always-return': 'error',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-native': 'off',
    'promise/no-nesting': 'warn',
    'promise/no-promise-in-callback': 'off',
    'promise/no-callback-in-promise': 'off',
    'promise/avoid-new': 'warn',
    'promise/no-new-statics': 'error',
    'promise/no-return-in-finally': 'warn',
    'promise/valid-params': 'warn',

    // plugin: security
    'security/detect-object-injection': 'off', // https://github.com/eslint-community/eslint-plugin-security/issues/21#issuecomment-1157887653
  },
  ignorePatterns: ['node_modules/'],
};
