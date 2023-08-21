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
    salt: string
) {
    const saltedPassword = new TextEncoder().encode(signingPassword + salt);
    const hashedPassword = await crypto.subtle.digest("SHA-256", saltedPassword);
    const [key, iv] = await Promise.all([
        crypto.subtle.importKey("raw", hashedPassword, "AES-GCM", false, [
            "decrypt",
        ]),
        crypto.subtle
            .digest("SHA-1", hashedPassword)
            .then((buffer) => buffer.slice(0, 12)),
    ]);
    return new Uint8Array(
        await crypto.subtle.decrypt(
            {name: "AES-GCM", iv},
            key,
            Buffer.from(encryptedPrivateKey)
        )
    );
}
