const PBKDF2_ITERATIONS = 210_000;
const HASH_ALGORITHM = 'SHA-256';

function bytesToBase64(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function getCrypto() {
    if (!globalThis.crypto?.subtle) throw new Error('El sistema no dispone de cifrado seguro para contraseñas.');
    return globalThis.crypto;
}

export function isPasswordHash(value) {
    return typeof value === 'string' && value.startsWith('pbkdf2_sha256$');
}

export async function hashPassword(password) {
    if (typeof password !== 'string' || password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres.');
    }
    const cryptoApi = getCrypto();
    const salt = cryptoApi.getRandomValues(new Uint8Array(16));
    const key = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const derived = await cryptoApi.subtle.deriveBits(
        { name: 'PBKDF2', hash: HASH_ALGORITHM, salt, iterations: PBKDF2_ITERATIONS }, key, 256,
    );
    return `pbkdf2_sha256$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(derived))}`;
}

export async function verifyPassword(password, storedValue) {
    if (!isPasswordHash(storedValue)) return password === storedValue;
    const [, iterationsText, saltText, hashText] = storedValue.split('$');
    const iterations = Number(iterationsText);
    if (!Number.isSafeInteger(iterations) || iterations < 100_000 || !saltText || !hashText) return false;
    const cryptoApi = getCrypto();
    const key = await cryptoApi.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const derived = new Uint8Array(await cryptoApi.subtle.deriveBits(
        { name: 'PBKDF2', hash: HASH_ALGORITHM, salt: base64ToBytes(saltText), iterations }, key, 256,
    ));
    const expected = base64ToBytes(hashText);
    if (derived.length !== expected.length) return false;
    let difference = 0;
    for (let index = 0; index < derived.length; index += 1) difference |= derived[index] ^ expected[index];
    return difference === 0;
}
