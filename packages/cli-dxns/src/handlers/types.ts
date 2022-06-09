//
// Copyright 2021 DXOS.org
//

import pb from 'protobufjs';

import { CID, DomainKey, DXN, RegistryType, Resource, TypeRecordMetadata } from '@dxos/registry-client';

import { Params } from '../interfaces';
import { resolveDXNorCID, uploadToIPFS } from '../utils';
import { printResource, printType, printTypes } from './common';

export const listTypes = (params: Params) => async (argv: any) => {
  const client = await params.getDXNSClient();
  const types = await client.registryClient.getTypeRecords();

  printTypes(types, argv);
};

export const getType = (params: Params) => async (argv: any) => {
  const client = await params.getDXNSClient();
  const cid = await resolveDXNorCID(client, argv);

  const typeRecord = await client.registryClient.getTypeRecord(cid);
  if (!typeRecord) {
    throw new Error(`No type registered under CID ${cid}.`);
  }

  printType(typeRecord, argv);
};

export const addType = (params: Params) => async (argv: any) => {
  const { path, domain, messageName, resourceName, description } = argv;

  const client = await params.getDXNSClient();
  const account = await client.getDXNSAccount(argv);
  const config = params.config;

  if (!!resourceName !== !!domain) {
    throw new Error('You must specify both name and domain or neither.');
  }

  const schemaRoot = await pb.load(path as string);

  const protobufIpfsCid = await uploadToIPFS(config, path);
  const meta: TypeRecordMetadata = {
    description,
    protobufIpfsCid
  };

  const cid = await client.registryClient.registerTypeRecord(messageName, schemaRoot, meta);
  const typeRecord: RegistryType = {
    cid,
    ...meta,
    type: {
      messageName: messageName,
      protobufDefs: schemaRoot,
      protobufIpfsCid: CID.from(protobufIpfsCid)
    }
  };

  if (resourceName) {
    const domainKey = DomainKey.fromHex(domain as string);
    const dxn = DXN.fromDomainKey(domainKey, resourceName as string);
    await client.registryClient.registerResource(dxn, cid, account);
    const resource = {
      name: DXN.fromDomainKey(domainKey, resourceName as string)
    };

    printResource(resource as Resource, argv);
  } else {
    printType(typeRecord, argv);
  }
};
