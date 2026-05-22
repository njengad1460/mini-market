const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const redirectSignIn = currentOrigin
  ? `${currentOrigin}/auth/callback`
  : import.meta.env.VITE_REDIRECT_SIGN_IN;
const redirectSignOut = currentOrigin || import.meta.env.VITE_REDIRECT_SIGN_OUT;

const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ['openid', 'email', 'profile', 'phone'],
          redirectSignIn: [redirectSignIn],
          redirectSignOut: [redirectSignOut],
          responseType: 'code',
        },
        email: true,
      },
    },
  },
};

export default awsConfig;
