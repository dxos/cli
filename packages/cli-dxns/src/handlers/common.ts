//
// Copyright 2021 DXOS.org
//

import { print as cliPrint } from '@dxos/cli-core';
import { CID, RegistryRecord, RegistryType, ResourceSet } from '@dxos/registry-client';

export const displayHash = (data: any) => {
  if (data.bundle) {
    try {
      const cid = CID.from(Buffer.from(data.bundle, 'base64'));
      data.bundle = cid.toString();
    } catch (e) {
      data.bundle = '';
    }
  }

  return data;
};

export const displayRecord = (record: RegistryRecord) => {
  return {
    cid: record.cid.toString(),
    displayName: record.displayName,
    description: record.description,
    tags: record.tags,
    created: record.created?.toISOString(),
    payload: displayHash(record.payload)
  };
};

export const displayType = (type: RegistryType) => {
  return {
    cid: type.cid.toString(),
    displayName: type.displayName,
    description: type.description,
    tags: type.tags,
    created: type.created?.toISOString(),
    messageName: type.type.messageName
  };
};

export const displayResource = (resource: ResourceSet) => {
  return ({
    name: resource.name.toString(),
    tags: Object.keys(resource.tags)
  });
};

export const printRecord = (record: RegistryRecord, argv: any): void => {
  cliPrint(displayRecord(record), { json: argv.json });
};

export const printRecords = (records: RegistryRecord[], argv: any): void => {
  cliPrint(records.map(displayRecord), { json: argv.json });
};

export const printType = (type: RegistryType, argv: any): void => {
  cliPrint(displayType(type), { json: argv.json });
};

export const printTypes = (types: RegistryType[], argv: any): void => {
  cliPrint(types.map(displayType), { json: argv.json });
};

export const printResource = (resource: ResourceSet, argv: any): void => {
  cliPrint(displayResource(resource), { json: argv.json });
};

export const printResources = (resources: ResourceSet[], argv: any): void => {
  cliPrint(resources.map(displayResource), { json: argv.json });
};
