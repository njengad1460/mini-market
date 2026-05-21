import mongoose from 'mongoose';
import { ENV } from './config/env.js';
import User from './models/User.js';

async function test() {
  await mongoose.connect(ENV.MONGODB_URI);
  try {
    const user = await User.create({
      cognitoSub: 'test-sub-1234',
      email: 'test@example.com',
      name: 'System Admin',
      phone: '+254000000000',
      role: 'admin'
    });
    console.log('Success:', user);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}
test();
