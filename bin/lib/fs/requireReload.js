var path = require('path');

module.exports = requireReload;

function requireReload(file) {
  if(!path.isAbsolute(file)) {
  	file = path.join(process.cwd(), file);
  }
  if(require.resolve(file)) {
    delete require.cache[require.resolve(file)];
  }
  return require(file);
}