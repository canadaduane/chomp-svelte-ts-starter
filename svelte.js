Chomp.addExtension('chomp@0.1:npm');

Chomp.registerTemplate('svelte', function ({ name, targets, deps, env, templateOptions: { svelteConfig = null, sourceMaps = true, autoInstall, ...invalid } }) {
  if (Object.keys(invalid).length)
    throw new Error(`Invalid svelte template option "${Object.keys(invalid)[0]}"`);
  return [{
    name,
    targets,
    deps: [...deps, ...ENV.CHOMP_EJECT ? ['npm:install'] : ['node_modules/svelte', 'node_modules/svelte-preprocess', 'node_modules/mkdirp']],
    env,
    engine: 'node',
    run: `    import { readFile, writeFile } from 'fs/promises';
      import { compile, preprocess } from 'svelte/compiler';
      import mkdirp from 'mkdirp';
      import { dirname } from 'path';

      ${svelteConfig ? `var { default: svelteConfigObj } = await import(${svelteConfig === true ? '"./svelte.config.js"' : svelteConfig});` : ''} 

      const compilerOptions = {
        css: false
      };

			const filename = process.env.DEP;
      const dependencies = [];
			const svelte_options = { ...compilerOptions, filename };
      let code = await readFile(filename, 'utf-8');

			if (svelteConfigObj.preprocess) {
				const processed = await preprocess(code, svelteConfigObj.preprocess, { filename });
				if (processed.dependencies) dependencies.push(...processed.dependencies);
				if (processed.map) svelte_options.sourcemap = processed.map;
				code = processed.code;
			}

      try {
        var result = compile(code, svelte_options);
      } catch (err) {
        if (err.frame) {
          console.log(err.frame);
          throw err.message;
        } else {
          throw err;
        }
      }

      mkdirp.sync(dirname(process.env.TARGET));
      const cssFile = process.env.TARGET.replace(/\\.js$/, ".css");
      await Promise.all[
        writeFile(process.env.TARGET, result.js.code),
        writeFile(cssFile, result.css.code)${sourceMaps ? `,
        writeFile(process.env.TARGET + ".map", JSON.stringify(result.js.map)),
        writeFile(cssFile + ".map", JSON.stringify(result.css.map))` : ''}
      ];
    `
  }, ...ENV.CHOMP_EJECT ? [] : [{
    template: 'npm',
    templateOptions: {
      autoInstall,
      packages: ['svelte@3', 'svelte-preprocess', 'mkdirp'],
      dev: true
    }
  }]];
});
