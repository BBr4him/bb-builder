import { copySync } from 'fs-extra';

const packageJson = 'package.json';
const builders = 'builders.json';
const schema = 'build/schema.json';

const src = './';
const dest = './dist/';

(async () => {
  await copySync(`${src}${packageJson}`, `${dest}${packageJson}`);
  await copySync(`${src}${builders}`, `${dest}${builders}`);
  await copySync(`${src}${schema}`, `${dest}${schema}`);
})();
