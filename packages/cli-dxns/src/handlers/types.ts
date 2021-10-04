//
// Copyright 2021 DXOS.org
//

import pb from 'protobufjs';

import { DomainKey, DXN, RecordKind, RecordMetadata, RegistryTypeRecord, Resource } from '@dxos/registry-client';

import { resolveDXNorCID } from '../utils';
import { Params, printRecord, printResource, printResources } from './common';

export const listTypes = (params: Params) => async (argv: any) => {
  const client = await params.getDXNSClient();
  const resources = await client.registryClient.getResources();
  const types = resources.filter((r): r is Resource<RegistryTypeRecord> => r.record.kind === RecordKind.Type);

  printResources(types, argv);
};

export const getType = (params: Params) => async (argv: any) => {
  const client = await params.getDXNSClient();
  const cid = await resolveDXNorCID(client, argv);

  const typeRecord = await client.registryClient.getTypeRecord(cid);
  if (!typeRecord) {
    throw new Error(`No type registered under CID ${cid}.`);
  }

  printRecord(typeRecord, argv);
};

export const addType = (params: Params) => async (argv: any) => {
  const { path, domain, messageName, resourceName, version, description } = argv;

  if (!!resourceName !== !!domain) {
    throw new Error('You must specify both name and domain or neither.');
  }

  const client = await params.getDXNSClient();
  const schemaRoot = await pb.load(path as string);
  const meta: RecordMetadata = {
    created: new Date(),
    version,
    description
  };

  const cid = await client.registryClient.insertTypeRecord(schemaRoot, messageName, meta);
  const typeRecord: RegistryTypeRecord = {
    kind: RecordKind.Type,
    cid,
    protobufDefs: schemaRoot,
    messageName: messageName,
    meta
  };

  if (resourceName) {
    const domainKey = DomainKey.fromHex(domain as string);
    await client.registryClient.registerResource(domainKey, resourceName as string, cid);
    const resource: Resource = {
      id: DXN.fromDomainKey(domainKey, resourceName as string),
      record: typeRecord
    };

    printResource(resource, argv);
  } else {
    printRecord(typeRecord, argv);
  }
};
