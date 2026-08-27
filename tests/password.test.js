import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, isPasswordHash, verifyPassword } from '../src/utils/password.js';

test('hashPassword no guarda la contraseña original', async () => {
    const hash = await hashPassword('clave-segura-123');
    assert.equal(isPasswordHash(hash), true);
    assert.notEqual(hash, 'clave-segura-123');
});

test('verifyPassword acepta la clave correcta y rechaza otra', async () => {
    const hash = await hashPassword('clave-segura-123');
    assert.equal(await verifyPassword('clave-segura-123', hash), true);
    assert.equal(await verifyPassword('clave-incorrecta', hash), false);
});

test('verifyPassword mantiene compatibilidad con usuarios antiguos', async () => {
    assert.equal(await verifyPassword('admin123', 'admin123'), true);
    assert.equal(await verifyPassword('otra', 'admin123'), false);
});
