const sequelize = require('../src/config/database');

async function testConnection() {
    try {
        console.log('🔍 Testing database connection...\n');

        // Test koneksi
        await sequelize.authenticate();
        console.log('✅ Database connection successful!');
        console.log(`📁 Database type: ${sequelize.getDialect()}`);

        // Cek storage location untuk SQLite
        if (sequelize.getDialect() === 'sqlite') {
            console.log(`💾 Database file: ${sequelize.options.storage}`);
        }

        // Cek tabel yang ada
        const tables = await sequelize.getQueryInterface().showAllTables();
        console.log('\n📊 Tables in database:');
        if (tables.length === 0) {
            console.log('   (No tables yet - run server to create tables)');
        } else {
            tables.forEach(table => console.log(`   - ${table}`));
        }

        console.log('\n✨ Database test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database connection failed!');
        console.error('Error:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Make sure sqlite3 is installed: npm install sqlite3');
        console.error('   2. Check .env file configuration');
        console.error('   3. Ensure database folder exists');
        process.exit(1);
    }
}

testConnection();
