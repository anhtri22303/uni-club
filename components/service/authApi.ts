import axios from "axios"


interface LoginCredentials {
  email: string
  password: string
}


interface SignUpCredentials {
  username: string
  password: string
}


interface GoogleLoginCredentials {
  email: string
}


interface GoogleTokenCredentials {
  token: string
}


interface ForgotPasswordCredentials {
  email: string
}


interface ChangePasswordCredentials {
  email: string
  passcode: string
  newPassword: string
}


// Regular login
export const login = async (credentials: { username: string; password: string }) => {
  return axios.post("http://localhost:8080/auth/login", credentials);
};


// Google login with OAuth2 redirect
export const loginWithGoogle = async (): Promise<void> => {
  try {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  } catch (error) {
    console.error("Error during Google login:", error);
    throw error;
  }
};


// Handle Google callback
export const handleGoogleCallback = async (code: string) => {
  try {
    const response = await axios.get(`http://localhost:8080/auth/oauth2/callback?code=${code}`);
    console.log("Google callback success", response.data);
    return response.data;
  } catch (error) {
    console.error("Error during Google callback:", error);
    throw error;
  }
};


// Login with Google JWT Token
export const loginWithGoogleToken = async (credentials: GoogleTokenCredentials) => {
  try {
    const response = await axios.post("http://localhost:8080/auth/login/token/google", credentials);
    console.log("Google token login success");
    return response.data;
  } catch (error) {
    console.error("Error during Google token login:", error);
    throw error;
  }
};


// Add the signUp function
export const signUp = async (credentials: SignUpCredentials) => {
  return axios.post("http://localhost:8080/auth/register", credentials)
}


// // Add the forgotPassword function
// export const forgotPassword = async (credentials: ForgotPasswordCredentials) => {
//   return axios.post("http://localhost:8080/auth/forgot-password", credentials)
// }


// // Add the changePassword function
// export const changePassword = async (credentials: ChangePasswordCredentials) => {
//   return axios.post("http://localhost:8080/auth/change-password", credentials)
// }
