module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      isolatedModules: true
    }]
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    'jest.setup.ts',
    'database.test.ts'
  ],
  setupFilesAfterEnv: ['./src/__tests__/jest.setup.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/__tests__/**'
  ],
  verbose: true
}; 