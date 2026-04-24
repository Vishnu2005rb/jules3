const { SignJWT } = require('jose');
const bcrypt = require('bcryptjs');

async function testAuth() {
  const secret = new TextEncoder().encode('hackathon-default-secret-key-2024');

  // Test password match
  const hash = await bcrypt.hash('admin123', 10);
  const match = await bcrypt.compare('admin123', hash);
  console.log('Password Match Test:', match);

  // Test JWT sign
  const token = await new SignJWT({ id: '1', username: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  console.log('JWT Sign Success:', !!token);

  // Test JWT verify (if we want to be thorough)
  const { jwtVerify } = require('jose');
  const verified = await jwtVerify(token, secret);
  console.log('JWT Verify Success:', !!verified.payload);
}

testAuth();
