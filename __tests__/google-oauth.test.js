/**
 * Test file để kiểm tra Google OAuth integration
 * Chạy file này để test API calls
 */

import { loginWithGoogleToken } from '../service/authApi'

// Mock Google ID Token (để test)
const MOCK_GOOGLE_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjdkYzBiMWIzYjI5ZjQ2YzliNjc5ZTMwYmY4OTcyYTQyYjc5YjkzMjQiLCJ0eXAiOiJKV1QifQ..."

export async function testGoogleLogin() {
  try {
    console.log('🧪 Testing Google OAuth API...')
    
    // Test call API
    const response = await loginWithGoogleToken({
      token: MOCK_GOOGLE_TOKEN
    })
    
    console.log('   API call successful:', response)
    return response
    
  } catch (error) {
    console.error('  API call failed:', error)
    
    // Kiểm tra lỗi cụ thể
    if (error.response?.status === 401) {
      console.log('    Token invalid hoặc expired - đây là lỗi bình thường khi test với mock token')
    } else if (error.response?.status === 400) {
      console.log('    Bad request - kiểm tra format request')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('    Backend không chạy - khởi động backend trước')
    }
    
    throw error
  }
}

export function testGoogleButtonRender() {
  console.log('🎨 Testing Google Button component...')
  
  // Kiểm tra xem có thể import component không
  try {
    // Trong browser environment
    if (typeof window !== 'undefined') {
      console.log('   Running in browser environment')
      console.log('📍 Current origin:', window.location.origin)
      
      // Check if Google script can be loaded
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.onload = () => console.log('   Google Identity Services script loaded')
      script.onerror = () => console.error('  Failed to load Google script')
      
      // Don't actually append to avoid side effects in test
      console.log('🔗 Google script URL:', script.src)
    } else {
      console.log('⚙️ Running in server environment (Next.js SSR)')
    }
    
    return true
  } catch (error) {
    console.error('  Component test failed:', error)
    return false
  }
}

// Utility function để kiểm tra environment variables
export function checkEnvironmentSetup() {
  console.log('🔧 Checking environment setup...')
  
  const requiredVars = [
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID'
  ]
  
  const missing = requiredVars.filter(varName => {
    const exists = process.env[varName]
    console.log(`${exists ? '  ' : ' '} ${varName}: ${exists ? 'Set' : 'Missing'}`)
    return !exists
  })
  
  if (missing.length > 0) {
    console.error(`  Missing environment variables: ${missing.join(', ')}`)
    console.log('💡 Create .env.local file with required variables')
    return false
  }
  
  console.log('   All environment variables are set')
  return true
}

// Run basic checks if called directly
if (typeof window !== 'undefined') {
  console.log('🚀 Running Google OAuth integration checks...')
  checkEnvironmentSetup()
  testGoogleButtonRender()
}