#!/usr/bin/env node
const path = require('path');
const program = require('commander');
const { inspect } = require('util');
const packageInfo = require('./package.json');
const bundler = require('./lib/bundler');
const merge = require('deepmerge');
const xfs = require('fs.extra');
const YAML = require('js-yaml');

const red = text => `\x1b[31m${text}\x1b[0m`;
const magenta = text => `\x1b[35m${text}\x1b[0m`;
const yellow = text => `\x1b[33m${text}\x1b[0m`;
const green = text => `\x1b[32m${text}\x1b[0m`;

let openapiDir;
let baseDir;
let mainFilePath;

const defaultOutput = path.resolve(process.cwd(), 'combine.yaml');

program
  .version(packageInfo.version)
  .arguments('<openapiDirPath>')
  .action(openapiDirPath => {
    openapiDir = openapiDirPath;
    baseDir = openapiDir;
    mainFilePath = path.resolve(baseDir, 'main.yaml')
})
  .option('-o, --output <outputFilePath>', 'where to put the generated file (defaults to current directory)',
    defaultOutput)
  .option('-m, --main <mainFilePath>', 'main file, last openapi file in merge list',
    mainFilePath)
  .option('--no-components', 'remove components')
  .parse(process.argv);

if (!openapiDir) {
  console.error(red('> Dir to OpenAPI file not provided.'));
  program.help(); // This exits the process
}

const generate = config => new Promise((resolve, reject) => {
    const walker = xfs.walk(config.openapiDir, {
        followLinks: false
    });
    const openapiList = [];
    let mainApi = null; // main file, last openapi in merge list

    walker.on('file', async (root, stats, next) => {
      try {
        if (stats.name === path.basename(mainFilePath)) {
          mainApi = await bundler(mainFilePath, baseDir);
          next();
        }
        if (path.extname(stats.name) === '.yaml') {
          const filepath = path.resolve(path.join(root, stats.name))
          const openapi = await bundler(filepath, baseDir);
          openapiList.push(openapi)
          next();
        }
      } catch (e) {
        reject(e)
      }
    });

    walker.on('errors', (root, nodeStatsArray) => {
        reject(nodeStatsArray);
    });

    walker.on('end', async () => {
      if(mainApi) {
        openapiList.push(mainApi);
      }
      const result = merge.all(openapiList);

      // remove components
      if(program.components === false) delete result.components;

      xfs.writeFileSync(program.output, YAML.safeDump(result));
      resolve();
    });
});

generate({
    openapiDir
}).then(() => {
  console.log(green('Done! ✨'));
  console.log(yellow('Check out your shiny new API at ') + magenta(program.output) + yellow('.'));
}).catch(err => {
  console.error(red('Aaww 💩. Something went wrong:'));
  console.error(red(err.stack || err.message || inspect(err, { depth: null })));
});

process.on('unhandledRejection', (err) => console.error(err));
