import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { ENV } from '../config/env.js';

let verifier = null;

if (ENV.COGNITO_USER_POOL_ID && ENV.COGNITO_CLIENT_ID) {
  try {
    verifier = CognitoJwtVerifier.create({
      userPoolId: ENV.COGNITO_USER_POOL_ID,
      clientId:   ENV.COGNITO_CLIENT_ID,
      tokenUse:   'id',
    });
  } catch (err) {
    console.warn('[WARN] Could not initialize Cognito verifier:', err.message);
  }
} else {
  console.warn('[WARN] COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID is not configured. Protected routes will reject auth until set in .env.');
}

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  if (!verifier) {
    return res.status(500).json({ message: 'Cognito authentication is not configured on this server. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID in your .env file.' });
  }

  try {
    const payload = await verifier.verify(token);
    const groups  = payload['cognito:groups'] || [];

    let role = 'customer';
    if (groups.some(g => g.toLowerCase() === 'admin')) role = 'admin';
    else if (groups.some(g => g.toLowerCase() === 'staff')) role = 'staff';

    req.user = {
      cognitoSub: payload.sub,
      email:      payload.email,
      name:       payload.name,
      phone:      payload.phone_number,
      role,
    };

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authenticate;
