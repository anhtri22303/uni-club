declare module '@react-oauth/google' {
  export interface CredentialResponse {
    credential?: string;
    select_by?: string;
  }

  export interface GoogleLoginProps {
    onSuccess: (credentialResponse: CredentialResponse) => void;
    onError?: () => void;
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    width?: string | number;
  }

  export interface GoogleOAuthProviderProps {
    clientId: string;
    children: React.ReactNode;
  }

  export const GoogleLogin: React.FC<GoogleLoginProps>;
  export const GoogleOAuthProvider: React.FC<GoogleOAuthProviderProps>;
}