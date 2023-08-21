var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as ecies from "eciesjs";
import crypto from "crypto";
export function encryptWithECIES(publicKey, message) {
    const result = ecies.encrypt(Buffer.from(publicKey), Buffer.from(message));
    return result.toString("hex");
}
export function decryptWithECIES(privateKey, encryptedInECIES) {
    return ecies
        .decrypt(Buffer.from(privateKey), Buffer.from(encryptedInECIES))
        .toString();
}
export function decryptWithGCM(encryptedPrivateKey, signingPassword, salt) {
    return __awaiter(this, void 0, void 0, function* () {
        const saltedPassword = new TextEncoder().encode(signingPassword + salt);
        const hashedPassword = yield crypto.subtle.digest("SHA-256", saltedPassword);
        const [key, iv] = yield Promise.all([
            crypto.subtle.importKey("raw", hashedPassword, "AES-GCM", false, [
                "decrypt",
            ]),
            crypto.subtle
                .digest("SHA-1", hashedPassword)
                .then((buffer) => buffer.slice(0, 12)),
        ]);
        return new Uint8Array(yield crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, Buffer.from(encryptedPrivateKey)));
    });
}
