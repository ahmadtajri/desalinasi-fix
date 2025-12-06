// Test Script untuk Delete by Compartment
// Jalankan dengan: node test-delete-compartment.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testDeleteByCompartment() {
    console.log('=== Testing Delete by Compartment Endpoint ===\n');

    // Test 1: Delete valid compartment
    console.log('Test 1: Delete compartment 1');
    try {
        const response = await axios.delete(`${BASE_URL}/sensors/compartment/1`);
        console.log('✅ Success:', response.data);
        console.log('   Status:', response.status);
        console.log('   Deleted count:', response.data.deletedCount);
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
        console.log('   Status:', error.response?.status);
    }
    console.log('');

    // Test 2: Delete invalid compartment (too high)
    console.log('Test 2: Delete compartment 10 (invalid)');
    try {
        const response = await axios.delete(`${BASE_URL}/sensors/compartment/10`);
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.log('❌ Expected Error:', error.response?.data);
        console.log('   Status:', error.response?.status);
    }
    console.log('');

    // Test 3: Delete invalid compartment (zero)
    console.log('Test 3: Delete compartment 0 (invalid)');
    try {
        const response = await axios.delete(`${BASE_URL}/sensors/compartment/0`);
        console.log('✅ Success:', response.data);
    } catch (error) {
        console.log('❌ Expected Error:', error.response?.data);
        console.log('   Status:', error.response?.status);
    }
    console.log('');

    // Test 4: Delete compartment with no data
    console.log('Test 4: Delete compartment 6 (might have no data)');
    try {
        const response = await axios.delete(`${BASE_URL}/sensors/compartment/6`);
        console.log('✅ Success:', response.data);
        console.log('   Deleted count:', response.data.deletedCount);
    } catch (error) {
        console.log('❌ Error:', error.response?.data || error.message);
    }
    console.log('');

    // Test 5: Check all endpoints
    console.log('Test 5: Get API info');
    try {
        const response = await axios.get(`${BASE_URL}/`);
        console.log('✅ Available endpoints:');
        Object.entries(response.data.endpoints).forEach(([endpoint, description]) => {
            console.log(`   ${endpoint}: ${description}`);
        });
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Run tests
testDeleteByCompartment()
    .then(() => {
        console.log('\n=== Tests completed ===');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
