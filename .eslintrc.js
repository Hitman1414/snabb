module.exports = {
    root: true,
    extends: [
        'expo',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'react', 'react-hooks', '@tanstack/query'],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    rules: {
        // TypeScript
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-module-boundary-types': 'off',

        // React
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',

        // React Query
        '@tanstack/query/exhaustive-deps': 'error',
        '@tanstack/query/prefer-query-object-syntax': 'error',

        // General
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'prefer-const': 'warn',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
};
