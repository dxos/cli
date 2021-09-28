//
// Copyright 2020 DXOS.org
//

import {print} from './log'

export const printMissingProfile = () => {
  print('No active profile. Enter the following command to set the active profile:');
  print('dx profile set <NAME>');
}
