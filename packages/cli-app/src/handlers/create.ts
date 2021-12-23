//
// Copyright 2021 DXOS.org
//

import { TemplateHelper } from '@dxos/cli-core';
import { log } from '@dxos/debug';

export interface CreateParams {
  getReadlineInterface: Function
}

export const create = ({ getReadlineInterface }: CreateParams) => async (argv: any) => {
  const { template, path, githubToken, name, force, 'dry-run': noop } = argv;

  if (noop) {
    return;
  }

  const rl = getReadlineInterface();

  const askUser = async (question: string): Promise<string> => new Promise(resolve => {
    rl.question(question, (answer: string) => {
      resolve(answer);
    });
  });

  if (force) {
    const answer = await askUser('All pervious data on destination folder would be lost - do you want to proceed? (yes/no): ');
    if (!answer.toString().toLowerCase().startsWith('y')) {
      return;
    }
  }
  rl.close();

  const created = await TemplateHelper.downloadTemplateFromRepo(template, githubToken, path || name, force);

  const basename = created.split('/').slice(-1)[0];
  log(`./${basename} <- ${template}`);
};
