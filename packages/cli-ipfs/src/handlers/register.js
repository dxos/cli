// //
// // Copyright 2021 DXOS.org
// //

// import assert from 'assert';

// import { getGasAndFees } from '@dxos/cli-core';
// import { log, logError } from '@dxos/debug';
// import { CID, DXN, RecordKind } from '@dxos/registry-client';

// import { FILE_DXN_NAME } from '../config';

// export const register = ({ getDXNSClient, config }) => async (argv) => {
//   const { name, domain,  }
//   const client = await getDXNSClient();

//   const fileType = await client.registryClient.getResourceRecord(DXN.parse(FILE_DXN_NAME), 'latest');
//   assert(fileType);
//   assert(fileType.record.kind === RecordKind.Type);

//   const cid = await client.registryClient.insertDataRecord({
//     hash: CID.from(pkg['/']).value,
//     ...rest
//   }, fileType?.record.cid, {
//     description
//   });

//   const domainKey = await client.registryClient.resolveDomainName(domain);
//   const opts = { version: conf.version, tags: conf.tag ?? ['latest'] };
//   log(`Assigning name ${name}...`);
//   if (cid) {
//     try {
//       await client.registryClient.updateResource(DXN.fromDomainKey(domainKey, name), cid, opts);
//     } catch (err) {
//       if (skipExisting && String(err).includes('VersionAlreadyExists')) {
//         log('Skipping existing version.');
//       } else {
//         throw err;
//       }
//     }
//   }


  
  
  
  
  
  
  
//   const { txKey, name, cid, contentType, fileName, quiet = false } = argv;
//   const wnsConfig = config.get('runtime.services.wns');
//   const { server, userKey, bondId, chainId } = wnsConfig;

//   assert(server, 'Invalid WNS endpoint.');
//   assert(userKey, 'Invalid WNS userKey.');
//   assert(bondId, 'Invalid WNS bond ID.');
//   assert(chainId, 'Invalid WNS chain ID.');

//   !quiet && logError('Registering ...');

//   const record = {
//     type: FILE_TYPE,
//     contentType,
//     fileName,
//     package: {
//       '/': cid
//     }
//   };

//   const registry = new Registry(server, chainId);
//   const fee = getGasAndFees(argv, wnsConfig);

//   const result = await registry.setRecord(userKey, record, txKey, bondId, fee);
//   const recordId = result.data;
//   log(recordId);

//   if (name && name.length) {
//     // eslint-disable-next-line
//     for await (const wrn of name) {
//       await registry.setName(wrn, recordId, userKey, fee);
//       log(wrn);
//     }
//   }
// };
