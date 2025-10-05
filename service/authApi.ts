import axios from "axios"

// Expected response shape from backend on successful login
export interface LoginResponse {
  token: string
  userId: number | string
  email: string
  fullName: string
  role: string
}

export interface LoginCredentials {
  email: string
  password: string
}

// POST /auth/login -> returns token + user info
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const res = await axios.post<LoginResponse>("http://localhost:8080/auth/login", credentials)
  return res.data
}

// Keep other helpers (OAuth) as-is for the future
export const loginWithGoogle = async (): Promise<void> => {
  try {
    window.location.href = "http://localhost:8080/oauth2/authorization/google"
  } catch (error) {
    console.error("Error during Google login:", error)
    throw error
  }
}

export const handleGoogleCallback = async (code: string) => {
  try {
    const response = await axios.get(`http://localhost:8080/auth/oauth2/callback?code=${code}`)
    console.log("Google callback success", response.data)
    return response.data
  } catch (error) {
    console.error("Error during Google callback:", error)
    throw error
  }
}

export const loginWithGoogleToken = async (credentials: { token: string }) => {
  try {
    const response = await axios.post("http://localhost:8080/auth/login/token/google", credentials)
    console.log("Google token login success")
    return response.data
  } catch (error) {
    console.error("Error during Google token login:", error)
    throw error
  }
}

export const signUp = async (credentials: { username: string; password: string }) => {
  return axios.post("http://localhost:8080/auth/register", credentials)
}
