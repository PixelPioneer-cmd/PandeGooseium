/**
 * Configuration Jest pour les tests de Goose
 * @type {import('ts-jest').JestConfigWithTsJest}
 */
const config = {
  projects: [
    {
      displayName: 'api',
      preset: 'ts-jest',
      testEnvironment: 'node',
      injectGlobals: true,
      roots: ['<rootDir>/src', '<rootDir>/tests'],
      testMatch: ['<rootDir>/tests/api/**/*.test.ts', '<rootDir>/tests/utils/**/*.test.ts', '<rootDir>/tests/integration/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup-node.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
          tsconfig: 'tsconfig.json'
        }]
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      transformIgnorePatterns: ['node_modules/(?!(leven)/)'],
      testPathIgnorePatterns: ['/node_modules/'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    },
    {
      displayName: 'react',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      injectGlobals: true,
      roots: ['<rootDir>/src', '<rootDir>/tests'],
      testMatch: ['<rootDir>/tests/components/**/*.test.tsx', '<rootDir>/tests/hooks/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          useESM: true,
          tsconfig: {
            jsx: 'react-jsx',
            module: 'esnext',
            target: 'ES2017'
          }
        }]
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/src/$1'
      },
      transformIgnorePatterns: ['node_modules/(?!(leven)/)'],
      testPathIgnorePatterns: ['/node_modules/'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      testEnvironmentOptions: {
        url: 'http://localhost/'
      },
    }
  ]
};

export default config;
