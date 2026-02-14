require('dotenv').config(); // Make sure this is at the very top
const { sequelize } = require('../config/database');

// Add this at the top to see if models are loading
console.log('📦 Loading models...');

try {
  const models = require('../models');
  console.log('✓ Models loaded successfully');
  console.log('📋 Available models:', Object.keys(models).filter(key => key !== 'sequelize'));
} catch (error) {
  console.error('❌ Failed to load models:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

/**
 * Sync all models with the database
 */
const syncDatabase = async (options = {}) => {
  try {
    console.log('\n🔄 Starting database synchronization...\n');

    // Test connection first
    console.log('🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✓ Database connection verified\n');

    // Display sync mode
    if (options.force) {
      console.log('⚠️  WARNING: Running in FORCE mode - All data will be lost!');
      console.log('⚠️  This will DROP all existing tables and recreate them.\n');
    } else if (options.alter) {
      console.log('📝 Running in ALTER mode - Tables will be modified to match models');
      console.log('📝 Existing data will be preserved where possible.\n');
    } else {
      console.log('📝 Running in SAFE mode - Only missing tables will be created');
      console.log('📝 Existing tables and data will not be modified.\n');
    }

    // Perform synchronization
    console.log('⏳ Syncing models to database...');
    await sequelize.sync(options);

    console.log('\n=================================');
    console.log('✓ Database synchronized successfully!');
    console.log('=================================\n');

    // Display created tables
    console.log('📊 Tables in database:');
    const tables = await sequelize.getQueryInterface().showAllTables();
    tables.forEach(table => {
      console.log(`  ✓ ${table}`);
    });

    console.log(`\n📈 Total tables: ${tables.length}`);
    console.log('✓ All models are ready to use!\n');

  } catch (error) {
    console.error('\n❌ Database synchronization failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
    
    console.error('\nFull error:', error);
    throw error;
  }
};

/**
 * Drop all tables (DANGER: Use only in development)
 */
const dropAllTables = async () => {
  try {
    console.log('🗑️  Dropping all tables...\n');
    
    await sequelize.drop();
    
    console.log('✓ All tables dropped successfully\n');
  } catch (error) {
    console.error('✗ Failed to drop tables:', error);
    throw error;
  }
};


/**
 * Display database information
 */
const showDatabaseInfo = async () => {
  try {
    console.log('\n📊 Database Information:\n');

    // Show all tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`Total tables: ${tables.length}`);
    
    // Show table details
    for (const table of tables) {
      const description = await sequelize.getQueryInterface().describeTable(table);
      const columnCount = Object.keys(description).length;
      console.log(`\n  Table: ${table} (${columnCount} columns)`);
      
      // Show columns
      Object.entries(description).forEach(([column, details]) => {
        console.log(`    - ${column}: ${details.type}`);
      });
    }

    console.log('\n');
  } catch (error) {
    console.error('✗ Failed to retrieve database info:', error);
    throw error;
  }
};

// ============================================
// CLI INTERFACE
// ============================================

/**
 * Run from command line with different options
 * 
 * Usage:
 *   node src/db/sync.js              → Safe mode (only creates missing tables)
 *   node src/db/sync.js --force      → Force mode (drops and recreates all tables)
 *   node src/db/sync.js --alter      → Alter mode (modifies existing tables)
 *   node src/db/sync.js --drop       → Drop all tables
 *   node src/db/sync.js --info       → Show database information
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  const runCommand = async () => {
    try {
      if (args.includes('--drop')) {
        // Drop all tables
        await dropAllTables();
        
      } else if (args.includes('--info')) {
        // Show database info
        await showDatabaseInfo();
        
      } else {
        // Sync database with specified options
        const options = {
          force: args.includes('--force'),
          alter: args.includes('--alter')
        };
        
        await syncDatabase(options);
        
        // Optionally show info after sync
        if (args.includes('--verbose')) {
          await showDatabaseInfo();
        }
      }
      
      process.exit(0);
    } catch (error) {
      console.error('\n❌ Operation failed:', error.message);
      process.exit(1);
    }
  };

  runCommand();
}

module.exports = {
  syncDatabase,
  dropAllTables,
  showDatabaseInfo
};