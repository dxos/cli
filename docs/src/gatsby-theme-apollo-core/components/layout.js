//
// Copyright 2020 DXOS.org
//

import React from 'react';
import { Layout as SharedLayout } from '@dxos/docs-theme';
import { graphql, useStaticQuery } from 'gatsby';

export default function Layout ({ children }) {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
        }
      }
    }
  `);

  const { title, description } = data.site.siteMetadata;

  return (
    <SharedLayout title={title} description={description}>
      {children}
    </SharedLayout>
  );
}
