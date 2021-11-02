//
// Copyright 2021 DXOS.org
//

import pb from 'protobufjs';

import { DomainKey, DXN, RecordKind, RegistryTypeRecord, Resource, TypeRecordMetadata } from '@dxos/registry-client';

import { resolveDXNorCID, uploadToIPFS } from '../utils';
import { Params, printRecord, printRecords, printResource } from './common';

export const listTypes = (params: Params) => async (argv: any) => {
  const client = await params.getDXNSClient();
  const types = await client.registryClient.getTypeRecords();

  printRecords(types, argv);
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
  const { path, domain, messageName, resourceName, description, definitions } = argv;

  const client = await params.getDXNSClient();
  const config = params.config;

  if (!!resourceName !== !!domain) {
    throw new Error('You must specify both name and domain or neither.');
  }

  let sourceIpfsCid: string | undefined;

  if (definitions) {
    sourceIpfsCid = await uploadToIPFS(config, definitions);
  }
  const schemaRoot = await pb.load(path as string);
  const meta: TypeRecordMetadata = {
    description
  };

  if (sourceIpfsCid) {
    meta.sourceIpfsCid = sourceIpfsCid;
  }

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
    const dxn = DXN.fromDomainKey(domainKey, resourceName as string);
    await client.registryClient.updateResource(dxn, cid);
    const resource = {
      id: DXN.fromDomainKey(domainKey, resourceName as string)
    };

    printResource(resource as Resource, argv);
  } else {
    printRecord(typeRecord, argv);
  }
};
