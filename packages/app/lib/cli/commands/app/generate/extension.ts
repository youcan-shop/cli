import { Filesystem, Path, Session, Tasks } from '@youcan/cli-kit';
import { AppCommand } from '@/util/theme-command';
import type { AppConfig, InitialAppConfig } from '@/types';
import extensions from '@/cli/services/generate/extensions';
import { ensureExtensionDirectoryExists, initThemeExtension } from '@/cli/services/generate/generate';

class GenerateExtension extends AppCommand {
  async run(): Promise<any> {
    const filepath = Path.resolve(Path.cwd(), this.configFileName());

    const session = await Session.authenticate(this);
    const app = await Filesystem.readJsonFile<AppConfig | InitialAppConfig>(filepath);

    const { identifier } = await this.prompt({
      name: 'identifier',
      message: 'Extension type?',
      type: 'select',
      choices: extensions.map(ext => ({
        title: ext.name,
        value: ext.identifier,
        description: ext.description,
      })),
    });

    // TODO: prompt for extension type and flavor
    const extension = extensions.find(ext => ext.identifier === identifier)!;
    const type = extension.types[0];
    const flavor = type.flavors[0];

    const { name } = await this.prompt({
      name: 'name',
      message: 'Extension name?',
      type: 'text',
      initial: extension.name,
      validate: prev => prev.length >= 3,
    });

    await Tasks.run<{ directory: string }>([
      {
        title: 'Validating extension options..',
        async task(context) {
          context.directory = await ensureExtensionDirectoryExists(name);
        },
      },
      {
        title: 'Initializing extension..',
        async task(context) {
          await initThemeExtension({
            app,
            name,
            type,
            flavor,
            directory: context.directory,
          });
        },
      },
    ]);

    this.output.info(`Extension '${name}' successfully generated.`);
  }
}

export default GenerateExtension;
