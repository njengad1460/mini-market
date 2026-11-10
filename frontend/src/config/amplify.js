const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const redirectSignIn = currentOrigin
  ? `${currentOrigin}/auth/callback`
  : (import.meta.env.VITE_REDIRECT_SIGN_IN || 'http://localhost:5173/auth/callback');
const redirectSignOut = currentOrigin || import.meta.env.VITE_REDIRECT_SIGN_OUT || 'http://localhost:5173/';

const userPoolId = (import.meta.env.VITE_COGNITO_USER_POOL_ID || '').trim();
const userPoolClientId = (import.meta.env.VITE_COGNITO_CLIENT_ID || '').trim();
const cognitoDomain = (import.meta.env.VITE_COGNITO_DOMAIN || '').trim();

const loginWith = {
  email: true,
};

// Only configure OAuth if a Cognito domain is explicitly set
if (cognitoDomain) {
  loginWith.oauth = {
    domain: cognitoDomain,
    scopes: ['openid', 'email', 'profile', 'phone'],
    redirectSignIn: [redirectSignIn],
    redirectSignOut: [redirectSignOut],
    responseType: 'code',
  };
}

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith,
    },
  },
};

export default awsConfig;
