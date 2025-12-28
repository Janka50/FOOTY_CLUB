/**
 * Verify a module exports what you expect
 */
const checkExports = (modulePath, expectedExports) => {
  const module = require(modulePath);
  const actualExports = Object.keys(module);
  
  console.log(`Checking ${modulePath}:`);
  expectedExports.forEach(expected => {
    if (actualExports.includes(expected)) {
      console.log(`  ✓ ${expected}`);
    } else {
      console.error(`  ✗ ${expected} - MISSING!`);
    }
  });
};

// Usage
checkExports('./config/database', ['sequelize', 'testConnection']);