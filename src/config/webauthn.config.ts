const isDevelopment = process.env.NODE_ENV === 'dev';

export const webAuthnConfig = {
  rpName: 'AChamsterBlog WebAuthn',
  rpID: isDevelopment ? 'localhost' : 'achamster.live',
  origin: isDevelopment ? 'http://localhost:5173' : 'https://achamster.live',
  expected: isDevelopment ? 'http://localhost:5173' : 'https://achamster.live',
}
