# youcan-cli

> **Note**
> This is a work in progress, it will continue to evolve through internal feedback until a release candidate is ready.

YouCan CLI is a command line utility for building custom YouCan themes. It can be installed and run on Mac, Linux, and Windows systems. Using the CLI requires you to have pre-requisite knowledge of the YouCan themes system documented [here](https://developer.youcan.shop/).

If you have any feedback or bugs, please report them in the appropriate slack channel or by opening new issues.

## Installation

The tool is still internal, so installation will require some manual steps:

1. Clone the repository
```sh
$ git clone git@github.com:NextmediaMa/youcan-cli.git
$ cd youcan-cli
```
2. Install the required dependencies and build the binaries, this will require you to have [pnpm](https://pnpm.io/).
```sh
$ pnpm install
$ pnpm build
```
3. Link the binaries, this will allow you to call the `youcan` bins anywhere in your system.
```sh
$ pnpm prepare
$ pnpm link --global
```

You now have access to all of the YouCan CLI features, refer to this [Confluence Page](https://nextmediama.atlassian.net/wiki/spaces/YOUC/pages/2691399689/CLI+Commands) for details on every command.
