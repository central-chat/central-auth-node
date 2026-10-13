# @centralchat/central-auth

Mints [Central](https://central.chat) App Entry tokens: the JWT your backend
signs so the chat knows who just opened it.

> Server side only. It signs with a private key and throws if it finds a
> `window`.

## Install

```sh
npm install @centralchat/central-auth
```

Node ≥ 18.

## Use

```js
import { CentralAuth } from '@centralchat/central-auth';

// The path to the certificate file you downloaded.
const central = CentralAuth.fromFile('./central-app-entry-<kid>.json');

const token = await central.mintToken(userId, { userName });
```

The certificate file is the one you download when you generate your
business's App Entry certificate. Nothing in it is copied by hand.

If the certificate lives in an env var or a secret manager, pass its content
instead: `CentralAuth.fromString(process.env.CENTRAL_APP_ENTRY_CERT_JSON)`.

`userId` is the identity Central logs in, so it must come from your own session
and never from the request: whoever can choose it signs in as that person.

The token is valid for 300 seconds, which is the protocol ceiling — mint one per
entry rather than caching it.
## Try it

`examples/mint-token.js` mints one token so you can check a certificate without
editing anything — the path comes from the environment:

```sh
CENTRAL_APP_ENTRY_CERT=./central-app-entry-<kid>.json node examples/mint-token.js
```

`CENTRAL_USER_ID` and `CENTRAL_USER_NAME` are optional.

## License

Apache-2.0
