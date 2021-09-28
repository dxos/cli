//
// Copyright 2020 DXOS.org
//

import {print} from './log'

export const printMissingProfile = () => {
  print('No active profile. Enter the following command to set the active profile:');
  print('dx profile set <NAME>');
}

export const printProfileNotFound = (name: string) => {
  print(`Profile not found: ${name}. Use the following command to create it:`);
  print(`dx profile init --name <NAME> --help`);
  print('https://github.com/dxos/cli/blob/main/packages/cli/README.md#profiles')
}
