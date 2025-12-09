const app = require('./app');
const sequelize = require('./config/database');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3000;

// Test database connection and start server
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Database connected successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Database Info:');
    console.log(`   - Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   - Database: ${process.env.DB_NAME || 'iot_desalinasi'}`);
    console.log(`   - User: ${process.env.DB_USER || 'root'}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
    console.log('');

    // Start server
    app.listen(PORT, () => {
      console.log('🚀 Server is running on http://localhost:' + PORT);
      console.log('📡 API available at http://localhost:' + PORT + '/api');
      console.log('');
      console.log('💡 Tips:');
      console.log('   - Data is stored in MySQL database');
      console.log('   - All CRUD operations are persistent');
      console.log('   - To switch to mock data, edit src/services/DataService.js');
      console.log('     and set USE_MOCK_DATA = true');
      console.log('');
      console.log('✅ Ready to accept requests!');
      console.log('');
    });

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ Database connection failed!');
    console.error('═══════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('');
    console.error('⚠️  Please check:');
    console.error('   1. MySQL/XAMPP is running');
    console.error('   2. Database "iot_desalinasi" exists');
    console.error('   3. Credentials in .env are correct');
    console.error('   4. MySQL port 3306 is accessible');
    console.error('');
    console.error('💡 To use mock data instead:');
    console.error('   - Edit src/services/DataService.js');
    console.error('   - Set USE_MOCK_DATA = true');
    console.error('');
    console.error('═══════════════════════════════════════════════════════');
    console.error('');
    process.exit(1);
  }
}

// Start the server
startServer();

