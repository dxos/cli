# Documentation

## How to copy template into new project
1. Clone [DXOS/website](https://github.com/dxos/website) repository
2. Copy whole `docs-template` directory from _packages/docs-template_ into a new project
3. Change directory name to `docs`
4. In `gatsby-config.js` set:
    1. pathPrefix: `'/PROJECT_NAME'` _(ex. /sdk)_
    2. subtitle: `'DXOS PROJECT_NAME'`
    3. githubRepo: `'GITHUB_ORGANIZATION_NAME/REPOSITORY_NAME'`
    4. description
5. In `package.json` change:
    1. name: `'@dxos/PROJECT_NAME-docs'`
    2. description
    3. scripts:
        1. build: `"gatsby build --prefix-paths && mkdir -p YOUR_PATH_PREFIX && mv public/* YOUR_PATH_PREFIX && mv YOUR_PATH_PREFIX public/"`
    _(Replace all `YOUR_PATH_PREFIX` with provided in gatsby-config pathPrefix)_
        2. cp-socialcard: `"cp -f ./src/gatsby-theme-apollo-docs/components/social-card.js ./node_modules/gatsby-theme-apollo-docs/src/components/social-card.js"`,
        3. cp-socialcard-bg: `"cp -f ./node_modules/@dxos/docs-theme/src/assets/img/social-bg.jpg ./node_modules/gatsby-theme-apollo-docs/src/assets/social-bg.jpg"`,
6. Test new docs locally: (inside docs directory)
    1. `yarn install` - Install dependencies
    2. `yarn dev` - Start app
    3. `yarn build` - Build app
7. Deploy docs on Netlify:
    1. In Netlify dashboard create a new site from Git.
    2. Connect to Git Provider. (Choose Github)
    3. Choose `dxos` organisation.
    4. Pick the project where new docs are located.
    5. Set build settings:
        1. Owner: `WIRELINE`
        2. Branch to deploy: `master`
        3. **Skip** Build command
        4. **Skip** Publish directory
    6. Press `Deploy site`
    7. Set Site name : (Navigate to: Settings --> General --> Site details --> Press _Change site name_)
        1. Set Site name: `dxos-docs-PROJECT_NAME`
    8. Set base directory: (Navigate to: Settings --> Build & deploy --> Continuous Deployment --> Press _Edit Settings_)
        1. Base directory: `docs` _(Whole deploy configuration is in netlify.toml, in docs directory)_
    9. Deploy site:
        1. Navigate to Deploys section and press `Trigger deploy --> Deploy site`.
        2. After previous step, docs should be deployed under link(green) placed in top of netlify dashboard. (Site will be visible only with pathPrefix)
    10. Add ignore script when there are no changes:
        1. Go to your docs and open `netlify.toml` and add ignore script after line with command:
        ```
          ignore = "git diff --quiet master ."
        ```
        2. After committed changes on the master branch, check Deploys section in Netlify if new deploy was triggered
8. Setup redirects in main docs
    1. In repository **website**, go to packages --> docs --> static --> _redirects
    2. Add new redirects in new line:
        - Replace project name
        - Replace link to deployed app (link should be with pathPrefix, ex. www.dxos.com **/sdk**)
    ```
    # PROJECT NAME
    /PROJECT_NAME LINK_TO_DEPLOYED_APP_WITH_PREFIX/PROJECT_NAME/ 200!
    /PROJECT_NAME/* LINK_TO_DEPLOYED_APP_WITH_PREFIX/PROJECT_NAME/:splat 200!
   ```
9. Add information about new docs into main README.
    1. Copy the table below to the **root** project README.md (Copy form code view).

        | Module   | Status | Public URL |
        | -------- | ------ | ---------- |
        | DXOS DOCS <PROJECT_NAME> | <BADGE_LINK_FROM_NETLIFY> | <LINK_TO_MAIN_DOCS_WITH_PATH_PREFIX> |
        
    2. Change _Module_ name in copied table.
    3. Add status badge (Navigate in Netlify to: Settings --> General --> Status badges). 
        1. Copy link from netlify and paste into copied table (In _Status_ column).
    4. Add public link to [main docs](https://dxos-docs.netlify.app/) with created path prefix into copied table (In _Public URL_ column).
10. After successful deploy, add navigation link in docs-theme package 
([theme-options](https://github.com/dxos/website/blob/master/packages/docs-theme/theme-options.js) --> navConfig).
The link will be visible once the packages of docs-theme get updated.

```js
// Example navigation link
// 'DXOS [PROJECT_NAME]': {
//     url: [LINK_TO_MAIN_DOCS]/[PATH_PREFIX],
//     description: [DOCS_DESCRIPTION]
// } 

const navConfig = {
    ...,
    'DXOS TEMPLATE': {
        url: 'https://dxos-docs.netlify.app/PATH_PREFIX',
        description: 'DXOS TEMPLATE documentation.'
    }
}
```
    
> **Important note:** Remember that docs must always have at least one .md **and** mdx file to build successfully. 

> **Important note:** Deployed docs always will be available only with added on the end of the app link, path prefix  

> **Important note:** All links between different docs sub-pages must end with '/' char and can't have a file extension. Example -> `[Tutorial](../tutorial/)`  

## Running locally
To run DXOS Documentation website locally first clone DXOS/website repository, then :

1. `yarn install` in repository root directory - Install dependencies
2. Start app:
    1. `yarn build` in packages/docs directory - Start app for the first time (It will also build docs-components package)
    2. `yarn dev` in packages/docs directory - Start app (You must have already built docs-components package with .dist directory)
3. Open a browser to the link provided in the console.

> **Important note:** Changes to the markdown source does not result in an automatic "hot reload" in the browser; it is necessary to reload the page manually in the browser to see it re-rendered. 
> Additionally, changes in `gatsby_config.js` require stopping the server and restarting with `yarn start` again

> **Note:** Due problems with running app locally sometimes removing `.cache` and `.public` directories in packages/docs can solve the problem. 

## How to add new post
Add your markdown file `example.md` into `./content` directory 
then add the filename to the `sidebarCategories` configuration field in `gatsby-config.js`.

To add a section in the sidebar, create a folder in `./content`, add the markdown files there add configuration `gatsby-config.js`.

### Creating .md files
Each new file needs the below section at the beginning:

```markdown
---
title: Example Title
description: Example description
---
```

### Example of adding .md files into project
```
root/
    packages/
        docs/
            gatsby.config.js
            content/
                example1.md
                example2.md
                section1/
                    example3.md
                    example4.md
```

```
// ./packages/docs/gatsby-config.js

...
sidebarCategories: {
    null: [
        'example1',
        'example2'
    ],
    'Section 1 Title': [
        'section1/example3',
        'section1/example4'
    ]
}
...
```

### Adding images
To add images in .md/.mdx files add them to `./content/assets/img` and import from there.

![logo](content/assets/img/logo.png)

```markdown
![logo](assets/img/logo.png)
```

### Adding .MDX
MDX is an authorable format that lets you seamlessly use JSX in your markdown documents. You can import components and export metadata.

> **Note:** Every .md files can transform into .mdx but, not the other way around.

```markdown
// ./packages/docs/exampleCustomButton.mdx

---
title: Example Custom Button
description: Building a simple DXOS application
---

import CustomButton from '../../src/components/CustomButton';
   
<CustomButton color='primary'>Custom Button with props</CustomButton>
```

## How to style docs
To make any style changes navigate to [docs-theme](https://github.com/dxos/website/tree/master/packages/docs-theme) package.
You can customize docs using this theme further by taking advantage of [component shadowing](https://www.gatsbyjs.org/docs/themes/shadowing/) with [gatbsy-theme-apollo-docs](https://github.com/apollographql/gatsby-theme-apollo/tree/master/packages/gatsby-theme-apollo-docs).

Every imported file/component in new docs must be declared with the same name, directory structure and component export type as in [gatbsy-theme-apollo-docs](https://github.com/apollographql/gatsby-theme-apollo/tree/master/packages/gatsby-theme-apollo-docs) based on gatsby component shadowing approach.

After any changes, docs-theme package must be published into NPM and it also must be updated in every dxos docs listed in [theme-option.js](https://github.com/dxos/website/blob/master/packages/docs-theme/theme-options.js) file, in navConfig.  

### Layout
For editing layout components navigate to [components directory](https://github.com/dxos/website/tree/master/packages/docs-theme/src/components).

### Global styles
For editing global styles navigate to [styles directory](https://github.com/dxos/website/tree/master/packages/docs-theme/src/styles).

### Colors
For changes with site colors navigate to [colors.js](https://github.com/dxos/website/blob/master/packages/docs-theme/src/utils/colors.js)

## Deploy previews
Documentation repositories should be setup with a "deploy preview" feature which automatically provides "preview" links in the _status checks_ section of pull-requests.

In the event that it's not possible to run the documentation locally, pushing changes to the branch for a pull-request can be a suitable alternative that ensures changes to the documentation are properly rendered.
