// Simple test for employees API without authentication
const testEmployeeData = {
  name: "Nguyễn Văn Test",
  dateOfBirth: "1990-01-01",
  gender: "Nam",
  hometown: "Hà Nội",
  religion: "Không",
  ethnicity: "Kinh",
  startDate: "2024-01-01",
  phone: "0123456789",
  email: "test@company.com",
  placeOfBirth: "Hà Nội",
  position: "Developer",
  contractType: "Chính thức",
  department: "IT"
};

async function testEmployeesAPI() {
  console.log("Testing Employees API...");
  console.log("Test data:", testEmployeeData);
  
  try {
    // Test POST request to create employee
    console.log("Testing POST /api/employees...");
    const response = await fetch('http://localhost:3000/api/employees', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmployeeData)
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log("Response text:", responseText);
    
    try {
      const result = JSON.parse(responseText);
      console.log("Response data:", result);
    } catch (parseError) {
      console.log("Could not parse JSON response");
    }

    if (response.ok) {
      console.log("✅ Employee creation successful!");
    } else {
      console.log("❌ Employee creation failed");
    }

  } catch (error) {
    console.error("❌ Error testing API:", error.message);
  }
}

// Run the test
testEmployeesAPI();
