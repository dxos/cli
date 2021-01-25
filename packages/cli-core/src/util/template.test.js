import crypto from 'crypto';
import { tmpdir } from 'os';
import path from 'path';
import fs from 'fs';
import { TemplateHelper } from './template';

const TEST_REPO = 'https://github.com/dxos/async';

const tmpFolder = () => {
  return path.join(tmpdir(), `random.${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}`);
};

const appPath = tmpFolder();

describe('downloadTemplateFromRepo', () => {
  test('download template', async () => {
    const result = await TemplateHelper.downloadTemplateFromRepo(TEST_REPO, null, appPath, false);
    const files = fs.readdirSync(appPath);
    expect(result).toBe(appPath);
    expect(files.length).toBeGreaterThan(0);
  });

  test('throw the error if folder already exists', async () => {
    await expect(TemplateHelper.downloadTemplateFromRepo(TEST_REPO, null, appPath, false)).rejects.toThrow('Folder already exists');
  });

  test('force to override dest folder', async () => {
    await expect(TemplateHelper.downloadTemplateFromRepo(TEST_REPO, null, appPath, true)).resolves.toBeDefined();
  });
});
