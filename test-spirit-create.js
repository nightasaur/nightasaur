// Test script to create a spirit
const testCreateSpirit = async () => {
  try {
    // First login to get token
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@nightasaur.com',
        password: 'admin123!'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('Login successful, token:', token ? 'Received' : 'Not received');
    
    // Now create a spirit
    const createResponse = await fetch('http://localhost:3000/api/spirits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'TestFireSpirit',
        element: 'FIRE'
      })
    });

    const createData = await createResponse.json();
    console.log('Create spirit response:', createData);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testCreateSpirit();