export default {
    root: true,
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    extends: [
      'plugin:vue/vue3-recommended',
      'eslint:recommended',
      '@vue/typescript/recommended',
      'prettier',
    ],
    parserOptions: {
      ecmaVersion: 2021,
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      
      // Cognitive Load Rules
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      
      // Vue Specific
      'vue/multi-word-component-names': 'off', // Framework7 uses single word components like Page, List
      'vue/component-api-style': ['error', ['script-setup', 'composition']], // Enforce composition API
    },
  }
  
