import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'assets/dist', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    // Los .vue usan el parser de Vue y delegan el script en typescript-eslint
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
  },
  { rules: { '@typescript-eslint/no-explicit-any': 'error' } },
  prettier,
)
