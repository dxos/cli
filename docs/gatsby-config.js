//
// Copyright 2020 DXOS.org
//

const themeOptions = require("@dxos/docs-theme/theme-options");
module.exports = {
  pathPrefix: "/cli",
  plugins: [
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "images",
        path: `${__dirname}/assets/images`
      }
    },

    // Image processing
    // https://www.gatsbyjs.org/packages/gatsby-plugin-sharp
    // https://www.gatsbyjs.org/packages/gatsby-transformer-sharp
    // https://github.com/lovell/sharp
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",

    {
      resolve: "gatsby-theme-apollo-docs",
      options: {
        ...themeOptions,
        contentDir: "assets/content",
        root: __dirname,
        githubRepo: "dxos/cli",
        description: "DXOS - The Decentralized Operating System",
        subtitle: "DXOS cli",
        sidebarCategories: {
          null: ["index", "cli"]
        }
      } 
    }
  ]
};
