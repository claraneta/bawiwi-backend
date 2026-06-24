# Testing Guide

## Test Structure

This project uses **co-located tests** - test files are placed next to the code they test with `.test.ts` suffix.

### Folder Structure

```
src/
├── db/
│   ├── entities/
│   │   ├── index.ts
│   │   └── index.test.ts          # Entity tests
│
├── api/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── index.ts
│   │   │   └── index.test.ts      # Auth route tests
│   │   └── hello/
│   │       ├── index.ts
│   │       └── index.test.ts      # Hello route tests
│
├── helpers/
│   ├── validation.ts
│   └── validation.test.ts         # Helper tests
│
└── utilities/
    ├── formatter.ts
    └── formatter.test.ts          # Utility tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Writing Tests

### 1. API Route Tests (using Supertest)

```typescript
import request from 'supertest';
import express from 'express';
import myRoutes from './index';

describe('My Feature', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/my-feature', myRoutes);
  });

  it('should return 200', async () => {
    const response = await request(app).get('/my-feature');
    expect(response.status).toBe(200);
  });
});
```

### 2. Helper/Utility Tests

```typescript
import { myHelper } from './myHelper';

describe('myHelper', () => {
  it('should return expected result', () => {
    const result = myHelper('input');
    expect(result).toBe('expected');
  });
});
```

### 3. Entity Tests

```typescript
import { MyEntity } from './index';

describe('MyEntity', () => {
  it('should create instance', () => {
    const entity = new MyEntity();
    entity.name = 'Test';
    expect(entity.name).toBe('Test');
  });
});
```

### 4. Database Integration Tests

For tests that need a real database:

```typescript
import { AppDataSource } from '../../db/data-source';
import { User } from '../../db/entities';

describe('User Repository', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should save user', async () => {
    const user = new User();
    user.email = 'test@example.com';
    user.name = 'Test';
    
    const saved = await AppDataSource.manager.save(user);
    expect(saved.id).toBeDefined();
  });
});
```

## Best Practices

1. **One test file per source file** - `myFeature.ts` → `myFeature.test.ts`
2. **Descriptive test names** - Use `describe` and `it` to create readable test hierarchies
3. **Arrange-Act-Assert** - Structure tests clearly:
   - Arrange: Set up test data
   - Act: Execute the code
   - Assert: Verify results
4. **Mock external dependencies** - Use Jest mocks for database, APIs, etc.
5. **Clean up after tests** - Use `afterEach` / `afterAll` to reset state
6. **Test edge cases** - Don't just test happy paths

## Coverage Goals

- **Helpers/Utilities**: 90%+ coverage (pure functions are easy to test)
- **API Routes**: 80%+ coverage
- **Entities**: 70%+ coverage
- **Overall**: 75%+ coverage

## CI/CD Integration

Add to your CI pipeline:

```bash
npm run test:coverage
```

This will fail the build if tests don't pass.
