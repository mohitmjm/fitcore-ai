import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Global ignores.
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },

  // TRANSITIONAL: the legacy Supabase-era code (slated for replacement during the Clerk/MongoDB
  // re-platform) is full of `any` and unescaped entities. Demote those to warnings so they don't
  // block the build while we migrate, rather than rewriting code we're about to delete.
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },

  // New Phase 0 foundation must stay strictly clean — keep `any` an error here.
  {
    files: [
      'lib/core/**/*.ts',
      'lib/db/**/*.ts',
      'lib/services/**/*.ts',
      'lib/ai/router.ts',
      'lib/auth/**/*.ts',
      'app/api/v1/**/*.ts',
      'app/api/webhooks/**/*.ts',
      'middleware.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];

export default eslintConfig;
