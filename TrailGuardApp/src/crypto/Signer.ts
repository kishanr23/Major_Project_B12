/**
 * Signer — generates, persists, and uses an Ed25519 keypair for message signing.
 *
 * Private key is stored in the platform secure enclave via react-native-keychain:
 *   iOS:     Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly)
 *   Android: Android Keystore
 *
 * Crypto is provided by react-native-quick-crypto, which wraps BoringSSL and
 * exposes an API compatible with the Node.js crypto module (minus the namespace
 * import — it is imported as a default export).
 */
import * as Keychain from 'react-native-keychain';
import { generateKeyPairSync, createPrivateKey, sign as cryptoSign } from 'react-native-quick-crypto';

const KEYCHAIN_SERVICE = 'com.trailguard.ed25519';

/** Ed25519 signature size in bytes. */
export const SIGNATURE_BYTES = 64;
/** Raw Ed25519 public key size in bytes. */
export const PUBLIC_KEY_BYTES = 32;

export class Signer {
    private static _publicKeyHex: string | null = null;
    private static _privateKeyPkcs8Hex: string | null = null;

    /**
     * Must be called once at app startup before signMessage().
     * Loads an existing keypair from the secure keychain, or generates and
     * persists a new one if none exists.
     */
    static async initialize(): Promise<void> {
        const stored = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });

        if (stored) {
            // Restore from keychain (we stored pubkey as 'username', privkey as 'password').
            this._publicKeyHex      = stored.username;
            this._privateKeyPkcs8Hex = stored.password;
            return;
        }

        // First run — generate a fresh Ed25519 keypair.
        const { publicKey, privateKey } = generateKeyPairSync('ed25519');

        // Export public key (44-byte SPKI DER); raw 32-byte key is at offset 12.
        const pubDer = publicKey.export({ format: 'der', type: 'spki' }) as Uint8Array;
        const pubRaw = pubDer.slice(12); // 32 bytes
        this._publicKeyHex = Buffer.from(pubRaw).toString('hex');

        // Export private key as PKCS8 DER hex for Keychain storage.
        const privDer = privateKey.export({ format: 'der', type: 'pkcs8' }) as Uint8Array;
        this._privateKeyPkcs8Hex = Buffer.from(privDer).toString('hex');

        await Keychain.setGenericPassword(
            this._publicKeyHex,
            this._privateKeyPkcs8Hex,
            { service: KEYCHAIN_SERVICE },
        );
    }

    /** Returns the raw 32-byte public key as a hex string. */
    static getPublicKeyHex(): string {
        if (!this._publicKeyHex) throw new Error('Signer not initialized');
        return this._publicKeyHex;
    }

    /** Returns the raw 32-byte public key as a Buffer. */
    static getPublicKeyBytes(): Buffer {
        return Buffer.from(this.getPublicKeyHex(), 'hex');
    }

    /**
     * Signs a payload with the device's Ed25519 private key.
     * Returns a 64-byte signature Buffer.
     */
    static signMessage(payload: Buffer | Uint8Array): Buffer {
        if (!this._privateKeyPkcs8Hex) throw new Error('Signer not initialized');

        const privDer = Buffer.from(this._privateKeyPkcs8Hex, 'hex');
        const privKeyObj = createPrivateKey({
            key: privDer,
            format: 'der',
            type: 'pkcs8',
        });

        return cryptoSign(null, payload as Buffer, privKeyObj) as unknown as Buffer;
    }
}
