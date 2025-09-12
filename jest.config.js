module.exports = {
  displayName: 'js-split-provider',
  preset: 'ts-jest',

  // Test files are .js and .ts files inside of __tests__ folders and with a suffix of .test or .spec
  testMatch: ['<rootDir>/src/**/__tests__/**/?(*.)+(spec|test).[jt]s'],

  // Included files for test coverage (npm run test:coverage)
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts'
  ],

  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/packages/js-split-provider',
};
