import debug from 'debug';

const logger = {
  debug: debug('contentrain:query:debug'),
  info: debug('contentrain:query:info'),
  warn: debug('contentrain:query:warn'),
  error: debug('contentrain:query:error'),
};

// Debug modunu aktif et
debug.enable('contentrain:query:*');

export { logger };
