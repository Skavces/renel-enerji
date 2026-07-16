// Tek amaç: backend'de açık `any` kullanımını engellemek (kullanıcı tercihi).
// Stil/format kuralları bilinçli olarak yok — strict tip denetimi zaten tsc'de.
import tseslint from 'typescript-eslint'

export default tseslint.config({
  files: ['src/**/*.ts', 'test/**/*.ts'],
  languageOptions: { parser: tseslint.parser },
  plugins: { '@typescript-eslint': tseslint.plugin },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
})
