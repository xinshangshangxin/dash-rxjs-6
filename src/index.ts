import { clean, init } from './build';

init()
  .then(() => {
    return console.info('======== done =======');
  })
  .catch((e) => {
    console.warn(e);
    return clean();
  })
  .catch((e) => {
    console.warn(e);
  });
