// Test script để check backend Google OAuth endpoint
const testBackendEndpoints = async () => {
  const baseURL = "http://localhost:8080"
  
  console.log("🧪 Testing backend endpoints...")
  
  // Test 1: Health check
  try {
    const healthRes = await fetch(`${baseURL}/health`)
    console.log("✅ /health:", healthRes.status)
  } catch (e) {
    console.log("❌ /health: Not accessible")
  }
  
  // Test 2: Auth endpoints
  const authEndpoints = [
    "/auth/login",
    "/auth/google", 
    "/auth/register"
  ]
  
  for (const endpoint of authEndpoints) {
    try {
      const res = await fetch(`${baseURL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: "data" })
      })
      console.log(`✅ ${endpoint}:`, res.status, res.statusText)
    } catch (e) {
      console.log(`❌ ${endpoint}: Error - ${e.message}`)
    }
  }
  
  // Test 3: Swagger docs
  try {
    const swaggerRes = await fetch(`${baseURL}/swagger-ui/index.html`)
    if (swaggerRes.ok) {
      console.log("✅ Swagger UI available at:", `${baseURL}/swagger-ui/index.html`)
    }
  } catch (e) {
    console.log("❌ Swagger UI not accessible")
  }
}

// Chạy trong browser console
if (typeof window !== 'undefined') {
  window.testBackendEndpoints = testBackendEndpoints
  console.log("💡 Để test backend, chạy: testBackendEndpoints()")
}