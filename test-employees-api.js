// Test script for employees API
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
    const result = await response.json();
    console.log("Response data:", result);

    if (response.ok) {
      console.log("✅ Employee creation successful!");
    } else {
      console.log("❌ Employee creation failed:", result.error);
    }

  } catch (error) {
    console.error("❌ Error testing API:", error.message);
  }
}

// Run the test
testEmployeesAPI();
