## Commands

This folder contains the YouCan cli command implementation. Each command must be placed in its own folder. and must export a `setup` method that defines the command name, description, options?, and action.


> Folder structure:
```
commands
    -- exampleCommand
    ---- index.ts
```

> index.ts
```ts
function exampleAction() {
  // implementation
}

export default {
  setup(cli) {
    cli.command('example', 'example command description')
      .option('-o, --option', 'example option description')
      .action(exampleAction);
  }
};
```