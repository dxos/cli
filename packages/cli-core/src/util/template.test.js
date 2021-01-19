import crypto from 'crypto';
import { tmpdir } from 'os';
import path from 'path';
import fs from 'fs';
import { TemplateHelper } from './template';

const DEFAULT_TEMPLATE = 'https://github.com/wirelineio/logbot-template';

const tmpFolder = () => {
  return path.join(tmpdir(), `random.${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}`);
};

const appPath = tmpFolder();

describe('downloadTemplateFromRepo', () => {
  test('it should download template', async () => {
    const result = await TemplateHelper.downloadTemplateFromRepo(DEFAULT_TEMPLATE, null, appPath, false);
    const files = fs.readdirSync(appPath);
    expect(result).toBe(appPath);
    expect(files.length).toBeGreaterThan(0);
  });

  test('it should throw the error that folder already exists', async () => {
    await expect(TemplateHelper.downloadTemplateFromRepo(DEFAULT_TEMPLATE, null, appPath, false)).rejects.toThrow('Folder already exists');
  });

  test('it should recreate that folder', async () => {
    await expect(TemplateHelper.downloadTemplateFromRepo(DEFAULT_TEMPLATE, null, appPath, true)).resolves.toBeDefined();
  });
});
