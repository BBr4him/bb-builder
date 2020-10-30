import { copySync, removeSync } from 'fs-extra';

const tgz = 'bbfire-builders-1.0.0.tgz';

const src = './';
const dest = './dist/';

(async () => {
  await copySync(`${dest}${tgz}`, `${src}${tgz}`);
  await removeSync(dest);
})();
