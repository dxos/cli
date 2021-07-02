//
// Copyright 2020 DXOS.org
//

import React from 'react';
import { PageContent as SharedPageContent } from '@dxos/docs-theme/dist/src/components/PageContent';

export default function PageContent ({ children, ...rest }) {
  return (
    <SharedPageContent {...rest}>
      {children}
    </SharedPageContent>
  );
}
