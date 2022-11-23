# Contributing

YouCan-CLI is an open-source project, and we welcome your contributions.

Below, you can find some tips on how to contribute most effectively to the project.

## Table of content

How to contribute?

1. Setup your environment
2. Fork and clone this repository
3. Create your feature branch
4. Make your changes
5. Open a pull request


## 1. Set up your environment

YouCan-CLI is built and runs on the Node.js Javascript runtime.

### Requirements: 
- Install a code editor like `VS Code`.
- Install `Git` on your computer.
- Install the latest LTS version of Node.js - we recommend using a Node version manager like `nvm`.

## 2. Fork and clone this repository
In order to make your changes you have to clone a fork of this repository to your local machine.

* Ensure you have a Github account
* Clone your fork to your local machine
    ```
        git clone https://github.com/<your-username>/youcan-cli.git
        cd youcan-cli
    ```
* Add `NextmediaMa/youcan-cli` as the `upstream` repository
    ```
        git remote add upstream https://github.com/NextmediaMa/youcan-cli
    ```
* You should regularly pull from the `main` branch of the upstream repository to keep up to date with the latest changes to the project.
    ```
        git switch main
        git pull upstream main
    ```

## 3. Create your branch feature
Changes should be commited to a new local branch, which then gets pushed to your fork of the repository on github.

* Ensure you `main` branch is up to date
* Create a new branch based on the `main` branch
    ``` 
        git checkout -b <branch-name> main
    ```
* Commit your changes
    ```
        git add <files-path>
        git commit -m "your commit message"
    ```
* Push changes to your fork
    ```
        git push -u origin <branch-name>
    ```
## 4. Make your changes
Once you're satisfied with your changes, perform checks for formatting, linting, and testing errors before submitting your PR.
```
    npm run check
```

## 5. Submit your pull request

After you submit your PR, we will review it and either merge it or request changes, We'll do our best to provide you feedback along the way.

---
Thank you for your contribution!
