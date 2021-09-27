//
// Copyright 2021 DXOS.org
//

import pb from 'protobufjs';

import { CID, DomainKey, DXN, SuppliedRecordMetadata, RegistryTypeRecord, Resource } from '@dxos/registry-api';

import { Params, printRecord, printResource, printResources } from './common';

export const listTypes = (params: Params) => async (argv: any) => {
  const client = await params.getDXNSClient();
  const resources = await client.registryApi.getResources();
  const types = resources.filter((r): r is Resource<RegistryTypeRecord> => r.record.kind === 'type');

  printResources(types, argv);
};

export const getType = (params: Params) => async (argv: any) => {
  // TODO(marcin): Add support for DXN.
  const dxn = undefined as unknown as DXN;// argv.dxn ? DXN.parse(argv.dxn as string) : undefined;
  let cid = argv.cid ? CID.from(argv.cid as string) : undefined;

  if (!dxn && !cid) {
    throw new Error('Either DXN or CID must be provided');
  }

  const client = await params.getDXNSClient();
  cid = cid ?? await client.registryApi.resolve(dxn!);

  if (!cid) {
    throw new Error('CID not provided nor resolved through the provided DXN.');
  }

  const typeRecord = await client.registryApi.getTypeRecord(cid);
  if (!typeRecord) {
    throw new Error(`No type registered under CID ${cid}.`);
  }

  printRecord(typeRecord, argv);
};

export const addType = (params: Params) => async (argv: any) => {
  const { path, domain, messageName, resourceName, version, description, author } = argv;

  if (!!resourceName !== !!domain) {
    throw new Error('You must specify both name and domain or neither.');
  }

  const client = await params.getDXNSClient();
  const schemaRoot = await pb.load(path as string);
  const meta: SuppliedRecordMetadata = {
    version,
    name: resourceName,
    description,
    author
  };

  const cid = await client.registryApi.insertTypeRecord(schemaRoot, messageName, meta);
  const typeRecord: RegistryTypeRecord = {
    kind: 'type',
    cid,
    protobufDefs: schemaRoot,
    messageName: messageName,
    meta
  };

  if (resourceName) {
    const domainKey = DomainKey.fromHex(domain as string);
    await client.registryApi.registerResource(domainKey, resourceName as string, cid);
    const resource: Resource = {
      id: DXN.fromDomainKey(domainKey, resourceName as string),
      record: typeRecord
    };

    printResource(resource, argv);
  } else {
    printRecord(typeRecord, argv);
  }
};
