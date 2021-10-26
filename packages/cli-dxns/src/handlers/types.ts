//
// Copyright 2021 DXOS.org
//

import fs from 'fs';
import pb from 'protobufjs';

import { DomainKey, DXN, RecordKind, RecordMetadata, RegistryTypeRecord, Resource } from '@dxos/registry-client';

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

  if (!!resourceName !== !!domain) {
    throw new Error('You must specify both name and domain or neither.');
  }

  if (definitions) {
    if (!fs.existsSync(definitions)) {
      throw new Error('Incorrect path to definitons. File or directory does not exist');
    }
    let recursive = false;
    if (!fs.lstatSync(definitions).isDirectory) {
      recursive = true;
    }
    uploadToIPFS(definitions, { recursive });
  }

  const client = await params.getDXNSClient();
  const schemaRoot = await pb.load(path as string);
  const meta: RecordMetadata = {
    created: new Date(),
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
