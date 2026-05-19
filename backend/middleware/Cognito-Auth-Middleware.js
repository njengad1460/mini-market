import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { ENV } from '../config/env.js';

const verifier = CognitoJwtVerifier.create({
  userPoolId: ENV.COGNITO_USER_POOL_ID,
  clientId:   ENV.COGNITO_CLIENT_ID,
  tokenUse:   'id',
});

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const payload = await verifier.verify(token);
    const groups  = payload['cognito:groups'] || [];

    req.user = {
      cognitoSub: payload.sub,
      email:      payload.email,
      name:       payload.name,
      phone:      payload.phone_number,
      role:       groups[0] || 'customer', // highest precedence group wins
    };

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authenticate;
