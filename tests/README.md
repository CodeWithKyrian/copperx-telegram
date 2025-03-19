# Tests

This directory contains tests for the CopperX Telegram Bot.

## Directory Structure

- `commands/`: Tests for bot commands
- `services/`: Tests for service classes
- `api/`: Tests for API integrations
- `utils/`: Tests for utility functions
- `middlewares/`: Tests for bot middlewares
- `integration/`: Integration tests
- `setup.ts`: Global test setup

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage
npm run test:cov

# Debug tests
npm run test:debug
```

## Writing Tests

### Unit Tests

Unit tests should follow the AAA (Arrange-Act-Assert) pattern:

```typescript
describe('Feature', () => {
  it('should do something', () => {
    // Arrange - set up test
    const input = 'test';
    
    // Act - call the function/method
    const result = myFunction(input);
    
    // Assert - verify the result
    expect(result).toBe('expected output');
  });
});
```

### Mocking

Use Jest's mocking capabilities to isolate the code being tested:

```typescript
// Mock a module
jest.mock('../../src/services/auth.service');

// Mock a specific function
const mockFunction = jest.fn().mockReturnValue('mocked value');
```

### Testing Async Code

For testing asynchronous code, use async/await:

```typescript
it('should handle async operations', async () => {
  // Arrange
  const input = 'test';
  
  // Act
  const result = await asyncFunction(input);
  
  // Assert
  expect(result).toBe('expected output');
});
```