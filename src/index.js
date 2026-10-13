import {readFileSync} from 'node:fs';
import {CompactEncrypt, SignJWT, importJWK} from 'jose';

const AUDIENCE = 'central:app-entry';

// Central refuses a token whose exp is more than 300s past its iat.
const TTL_SECONDS = 300;

export class CentralAuth {
    #bundle;

    constructor(bundle) {
        if (typeof window !== 'undefined') {
            throw new Error('CentralAuth signs with a private key and must never run in a browser');
        }
        for (const field of ['kid', 'alg', 'iss', 'privateJwk', 'centralEncryptionKey']) {
            if (!bundle?.[field]) throw new Error(`CentralAuth bundle is missing ${field}`);
        }
        this.#bundle = bundle;
    }

    /** Reads the certificate file the console downloaded. */
    static fromFile(path) {
        return CentralAuth.fromString(readFileSync(path, 'utf8'));
    }

    /** Reads the certificate file's JSON content, e.g. from an env var or a secret manager. */
    static fromString(json) {
        return new CentralAuth(JSON.parse(json));
    }

    /**
     * Mints the entry token for one person: a JWS signed with your key, wrapped
     * in a JWE only Central can open.
     *
     * `userId` is the identity Central logs in, so it must come from your own
     * session and never from the request.
     */
    async mintToken(userId, {userName} = {}) {
        if (!userId) throw new Error('mintToken needs a userId');

        const {kid, alg, iss, privateJwk, centralEncryptionKey} = this.#bundle;

        // `userName` travels as the `name` claim, which is what Central reads.
        const jws = await new SignJWT({chat_account: kid, ...(userName ? {name: userName} : {})})
            .setProtectedHeader({alg, kid, typ: 'JWT'})
            .setIssuer(iss)
            .setSubject(String(userId))
            .setAudience(AUDIENCE)
            .setIssuedAt()
            .setExpirationTime(`${TTL_SECONDS}s`)
            .sign(await importJWK(privateJwk, alg));

        // bid/cid ride the JWE header so the embedded widget can route on the
        // token alone, without the page repeating the ids.
        return new CompactEncrypt(new TextEncoder().encode(jws))
            .setProtectedHeader({
                alg: centralEncryptionKey.alg,
                enc: 'A256GCM',
                cty: 'JWT',
                kid: centralEncryptionKey.kid,
                bid: iss,
                cid: kid,
            })
            .encrypt(await importJWK(centralEncryptionKey.publicJwk, centralEncryptionKey.alg));
    }
}
