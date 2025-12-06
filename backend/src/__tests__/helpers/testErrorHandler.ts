/**
 * Helper to wrap test functions and capture all errors
 */
export const withErrorHandling = (testFn: () => Promise<void>) => {
  return async () => {
    try {
      await testFn();
    } catch (error: any) {
      console.error('═══════════════════════════════════════');
      console.error('TEST ERROR CAUGHT:');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      if (error.matcherResult) {
        console.error('Matcher Result:', JSON.stringify(error.matcherResult, null, 2));
      }
      console.error('Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('═══════════════════════════════════════');
      throw error;
    }
  };
};

