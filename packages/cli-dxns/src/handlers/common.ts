//
// Copyright 2021 DXOS.org
//

import { DXNSClient } from '../index';

export interface Params {
  config?: any,
  getDXNSClient(): DXNSClient
}
