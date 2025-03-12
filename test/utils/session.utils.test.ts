// test/utils/session.utils.test.ts
import { sessionUtils } from '../../src/utils/session';
import { createMockContext } from './mock-context';

describe('Session Utils', () => {
    describe('setLanguage', () => {
        it('should set language in session', () => {
            // Arrange
            const ctx = createMockContext({ session: {} });

            // Act
            const result = sessionUtils.setLanguage(ctx, 'es');

            // Assert
            expect(result).toBe(true);
            expect(ctx.session.preferences).toEqual({ language: 'es' });
        });

        it('should return false if no session exists', () => {
            // Arrange
            const ctx = createMockContext({ session: undefined });

            // Act
            const result = sessionUtils.setLanguage(ctx, 'es');

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('getLanguage', () => {
        it('should return language from session', () => {
            // Arrange
            const ctx = createMockContext({
                session: { preferences: { language: 'es' } }
            });

            // Act
            const language = sessionUtils.getLanguage(ctx);

            // Assert
            expect(language).toBe('es');
        });

        it('should return default language if not set', () => {
            // Arrange
            const ctx = createMockContext({ session: {} });

            // Act
            const language = sessionUtils.getLanguage(ctx);

            // Assert
            expect(language).toBe('en');
        });
    });
});