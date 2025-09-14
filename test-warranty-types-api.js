// Test script for warranty-types API
const testWarrantyTypesAPI = async () => {
  console.log('=== Testing Warranty Types API ===');
  
  try {
    // Test 1: GET warranty types
    console.log('\n1. Testing GET /api/warranty-types');
    const getResponse = await fetch('http://localhost:3000/api/warranty-types');
    console.log('Status:', getResponse.status);
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✅ GET successful:', data);
    } else {
      console.log('❌ GET failed:', await getResponse.text());
    }
    
    // Test 2: POST new warranty type
    console.log('\n2. Testing POST /api/warranty-types');
    const postResponse = await fetch('http://localhost:3000/api/warranty-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Warranty Type',
        description: 'Test description'
      })
    });
    
    console.log('Status:', postResponse.status);
    
    if (postResponse.ok) {
      const data = await postResponse.json();
      console.log('✅ POST successful:', data);
    } else {
      const errorData = await postResponse.json();
      console.log('❌ POST failed:', errorData);
    }
    
    // Test 3: POST duplicate warranty type (should return 409)
    console.log('\n3. Testing POST duplicate warranty type (should return 409)');
    const duplicateResponse = await fetch('http://localhost:3000/api/warranty-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Warranty Type', // Same name as above
        description: 'Duplicate test'
      })
    });
    
    console.log('Status:', duplicateResponse.status);
    
    if (duplicateResponse.status === 409) {
      const errorData = await duplicateResponse.json();
      console.log('✅ Duplicate detection working:', errorData);
    } else {
      console.log('❌ Duplicate detection failed - should return 409');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the test
testWarrantyTypesAPI();
