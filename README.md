# YouCan CLI

YouCan CLI is a command line tool to simplify building YouCan Shop themes and apps.

Learn more in the [API Reference](#).

## Prerequisites

Install the latest version of [Node.js](https://nodejs.org/en/download/) and a package manager of your choice.

## Usage

### Developing Apps

You can initialize a YouCan Shop app template using your package manager of choice, this will install all the dependencies you need including YouCan CLI and [Qantra](https://github.com/youcan-shop/qantra)

- `npm init @youcan/app@latest`
- `pnpm create @youcan/create-app@latest`

Learn more in the docs: [Apps: Getting started](https://developer.youcan.shop/apps/introduction.html)

### Developing themes

To develop a YouCan Shop theme, you must first install the cli and the theme module globally with:

- `npm i -g @youcan/cli@latest @youcan/theme@latest`

To initialize a starter theme, run the following command:

- `youcan theme init`

To learn more about developing themes for YouCan Shop, refer to [Themes: Getting started](https://developer.youcan.shop/themes/introduction.html)

## Help

If you encounter any issues while using the YouCan CLI or have any suggestions, you can [open an issue](https://github.com/youcan-shop/cli/issues).
