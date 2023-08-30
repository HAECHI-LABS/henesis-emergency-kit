import * as ecies from "eciesjs";
import crypto from "crypto"

export function encryptWithECIES(
    publicKey: Uint8Array,
    message: Uint8Array
) {
    const result = ecies.encrypt(Buffer.from(publicKey), Buffer.from(message));
    return result.toString("hex");
}

export function decryptWithECIES(
    privateKey: Uint8Array,
    encryptedInECIES: Uint8Array
) {
    return ecies
        .decrypt(Buffer.from(privateKey), Buffer.from(encryptedInECIES))
        .toString();
}

export async function decryptWithGCM(
    encryptedPrivateKey: Uint8Array,
    signingPassword: string,
    salt: Uint8Array,
    iv: Uint8Array,
) {
    const pbkdf2InputRaw = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(signingPassword),
        {name: "PBKDF2"},
        false,
        ["deriveKey"]
    );
    const aesKey = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            hash: {name: "SHA-256"},
            iterations: 600000,
            salt: salt
        },
        pbkdf2InputRaw,
        {name: "AES-GCM", length: 256},
        false,
        ["decrypt"]
    )
    return new Uint8Array(
        await crypto.subtle.decrypt(
            {name: "AES-GCM", iv},
            aesKey,
            encryptedPrivateKey
        )
    );
}
