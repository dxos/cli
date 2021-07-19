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
  fqdn: string
}

export interface KubeDomainCreateOptions {
  dnsDomain: string
  boxName: string
  ipAddress: string
}

export interface Provider {
  /**
   * Deploy KUBE to a Provider.
   */
  deploy(options: KubeDeployOptions): Promise<any>

  /**
   * Create DNS record for deployed KUBE.
   */
  createDNS(options: KubeDomainCreateOptions): Promise<any>
}
