'use strict';

let nacl = require("tweetnacl");

const NUM_BITS = 4096; // 512, 1024, 2048 4096

class AsymmetricEncryption {
    constructor() {

    }

    /**
     * Generates a new random key pair for box and returns it as an object with publicKey and secretKey members
     *
     * @returns {nacl.BoxKeyPair}
     */
    generateKeyPair() {
        return nacl.box.keyPair();
    }

    /**
     *
     * @param secretKey
     * @returns {nacl.BoxKeyPair} a key pair for box with public key corresponding to the given secret key.
     */
    generateKeyPairUsingPassword(secretKey) {
        return nacl.box.keyPair.fromSecretKey(secretKey);
    }

    /**
     * Encrypts and authenticates message using peer's public key, our secret key, and the given nonce, which must be
     * unique for each distinct message for a key pair.
     *
     * @param message
     * @param nonce
     * @param extPublicKey
     * @param secretKey
     * @returns {Uint8Array} an encrypted and authenticated message, which is nacl.box.overheadLength longer than the
     * original message
     */
    encryptWithNonceAndExtPublicKey(message, nonce, extPublicKey, secretKey) {
        if(!nonce) {
            nonce = `muse.am-${new Date().getTime()}`;
        }
        return nacl.box(message, nonce, extPublicKey, secretKey);
    }

    /**
     * Authenticates and decrypts the given box with peer's public key, our secret key, and the given nonce.
     *
     * @param box
     * @param nonce
     * @param extPublicKey
     * @param secretKey
     * @returns {Uint8Array} the original message, or null if authentication fails.
     */
    decryptAuthenticatedWithNonce(box, nonce, extPublicKey, secretKey) {
        return nacl.box.open(box, nonce, extPublicKey, secretKey);
    }

    /**
     *
     * @param extPublicKey
     * @param secretKey
     * @returns {Uint8Array} a precomputed shared key to use with encrypt and decrypt functions that take sharedKey
     */
    generateSharedKey(extPublicKey, secretKey) {
        return nacl.box.before(extPublicKey, secretKey);
    }

    /**
     * Encrypts and authenticates message using a shared key and the given nonce, which must be unique for each distinct
     * message for a key pair.
     *
     * @param nonce
     * @param sharedKey
     * @returns {Uint8Array}
     */
    encryptWithNonceAndSharedKey(nonce, sharedKey) {
        return nacl.box.after(message, nonce, sharedKey)
    }

    /**
     * Authenticates and decrypts the given box with a shared Key, and the given nonce.
     *
     * @param box
     * @param nonce
     * @param sharedKey
     * @returns {Uint8Array} the original message, or null if authentication fails.
     */
    decryptWithNonceAndSharedKey(box, nonce, sharedKey) {
        return nacl.box.open.after(box, nonce, sharedKey);
    }
}