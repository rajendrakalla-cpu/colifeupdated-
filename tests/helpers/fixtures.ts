import fs from 'fs';
import path from 'path';

export interface TestFixtures {
    tenant: { id: string; token: string; phone: string };
    owner: { id: string; token: string; phone: string };
    admin: { id: string; token: string; phone: string };
    property: { id: string };
    room: { id: string };
    bed: { id: string };
}

export function loadFixtures(): TestFixtures {
    const fixturePath = path.join(__dirname, '..', 'fixtures', 'test-users.json');
    if (!fs.existsSync(fixturePath)) {
        throw new Error('Test fixtures not found. Did global-setup run?');
    }
    return JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
}