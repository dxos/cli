//
// Copyright 2021 DXOS.org
//

export const KUBE_TAG = 'kube';

export interface KubeDeployOptions {
  name: string
  region: string
  memory: number
  register: boolean
  pin: boolean
  letsencrypt: boolean
  email: string
  services: string
  keyPhrase: string
  sshKeys: string[]
}

export interface KubeDomainCreateOptions {
  dnsDomain: string
  boxName: string
  ipAddress: string
}

export type KUBE = {
  name: string
  createdAt: string,
  memory: number,
  vcpus: number,
  ipAddress: string,
  fqdn: string
}

export interface Provider {
  /**
   * Deploy KUBE to a Provider.
   */
  deploy(options: KubeDeployOptions): Promise<KUBE>

  /**
   * Create DNS record for deployed KUBE.
   */
  createDNS(options: KubeDomainCreateOptions): Promise<any>

  list(): Promise<KUBE[]>

  delete(name: string): Promise<void>

  get(name: string): Promise<KUBE | undefined>
}
