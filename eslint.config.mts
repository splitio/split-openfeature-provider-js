import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import jestPlugin from 'eslint-plugin-jest';


export default defineConfig([
  { 
    files: ["**/*.{js,ts}"], 
    plugins: { js }, 
    extends: ["js/recommended"], 
    languageOptions: { 
      globals: globals.browser 
    } 
  },
  {
    files: ['**/*.{test,spec}.{js,ts,jsx,tsx}', '**/__tests__/**/*.{js,ts,jsx,tsx}'],
    plugins: { jest: jestPlugin },
    rules: {
      ...jestPlugin.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  tseslint.configs.recommended,
]);
