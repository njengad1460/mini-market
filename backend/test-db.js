import mongoose from 'mongoose';

async function test() {
  await mongoose.connect('mongodb+srv://davidnjesh1460_db_user:qpmeyMscVaIQegW2@mini-market-website.g0vn7vc.mongodb.net/mini-market?appName=mini-market-website');
  
  const User = mongoose.model('User', new mongoose.Schema({
    cognitoSub: String,
    name: String,
    email: String,
    phone: String,
    role: String
  }));

  const Customer = mongoose.model('Customer', new mongoose.Schema({
    cognitoSub: String,
    name: String,
    email: String,
    phone: String,
  }));

  try {
    const users = await User.find();
    console.log('Users in DB:', users);
    const customers = await Customer.find();
    console.log('Customers in DB:', customers);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}
test();
