import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { ENV } from '../config/env.js';

const verifier = CognitoJwtVerifier.create({
  userPoolId: ENV.COGNITO_USER_POOL_ID,
  clientId:   ENV.COGNITO_CLIENT_ID,
  tokenUse:   'id',
});

// Like authenticate but never blocks — just attaches user if token is valid
const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();

  try {
    const payload = await verifier.verify(token);
    const groups  = payload['cognito:groups'] || [];
    req.user = {
      cognitoSub: payload.sub,
      email:      payload.email,
      name:       payload.name,
      phone:      payload.phone_number,
      role:       groups[0] || 'customer',
    };
  } catch {
    // invalid token — continue as guest
  }

  next();
};

export default optionalAuth;
