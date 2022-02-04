//
// Copyright 2021 DXOS.org
//

import { print as cliPrint } from '@dxos/cli-core';
import { RecordKind, RegistryRecord, Resource, CID } from '@dxos/registry-client';
import type { CliDataState } from '@dxos/cli-data';

import { DXNSClient } from '../index';

export interface Params extends CliDataState {
  config?: any,
  getDXNSClient(): Promise<DXNSClient>,
}

export const displayHash = (data: any) => {
  if (data.hash) {
    const cid = CID.from(Buffer.from(data.hash, 'base64'));
    data.hash = cid.toString();
  }
  return data;
};

export const displayRecord = (record: RegistryRecord) => {
  const common = {
    kind: record.kind,
    cid: record.cid.toString()
  };

  switch (record.kind) {
    case RecordKind.Type:
      return {
        ...common,
        messageName: record.messageName,
        ...record.meta,
        created: record.meta.created?.toISOString()
      };
    case RecordKind.Data:
      return {
        ...common,
        typeCid: record.type.toString(),
        ...record.meta,
        created: record.meta.created?.toISOString(),
        size: record.dataSize,
        data: displayHash(record.data)
      };
  }
};

export const displayResource = (resource: Resource) => {
  return ({
    dxn: resource.id.toString(),
    tags: Object.keys(resource.tags),
    versions: Object.keys(resource.versions),
    type: resource.type
  });
};

export const printRecord = (record: RegistryRecord, argv: any): void => {
  cliPrint(displayRecord(record), { json: argv.json });
};

export const printRecords = (records: RegistryRecord[], argv: any): void => {
  cliPrint(records.map(displayRecord), { json: argv.json });
};

export const printResource = (resource: Resource, argv: any): void => {
  cliPrint(displayResource(resource), { json: argv.json });
};

export const printResources = (resources: Resource[], argv: any): void => {
  cliPrint(resources.map(displayResource), { json: argv.json });
};
