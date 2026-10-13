// Mints one token, to check a certificate end to end without editing any code:
// the path comes from the environment.
//
//   CENTRAL_APP_ENTRY_CERT=./central-app-entry-<kid>.json node examples/mint-token.js
//
// CENTRAL_USER_ID and CENTRAL_USER_NAME are optional. The token prints to
// stdout and lasts 300 seconds.
import { CentralAuth } from '../src/index.js';

const certPath = process.env.CENTRAL_APP_ENTRY_CERT;
if (!certPath) {
    console.error('Set CENTRAL_APP_ENTRY_CERT to the certificate file the console downloaded.');
    process.exit(1);
}

const central = CentralAuth.fromFile(certPath);

const token = await central.mintToken(
    process.env.CENTRAL_USER_ID || 'example-user',
    { userName: process.env.CENTRAL_USER_NAME }
);

console.log(token);
