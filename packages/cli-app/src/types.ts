//
// Copyright 2021 DXOS.org
//

import { IReadOnlyRegistryClient } from '@dxos/registry-client';
import { MaybePromise } from '@dxos/util';

export type GetDXNSClient = () => MaybePromise<{ registryClient: IReadOnlyRegistryClient }>;
