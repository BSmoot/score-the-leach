module.exports = {
    extends: ['next/core-web-vitals'],
    rules: {
      // Disable the problematic TypeScript rules
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      // Other rules you might want to disable
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  };