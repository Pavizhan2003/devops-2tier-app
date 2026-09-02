const assert = require('assert');

// Verify default configuration and environment fallback
const defaultPort = process.env.PORT || 3000;
assert.strictEqual(Number(defaultPort), 3000, 'Default port must be 3000');

console.log('✔ Sanity tests passed successfully.');
process.exit(0);