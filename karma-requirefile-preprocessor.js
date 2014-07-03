
var util = require('util');


var TEMPLATE = ';' +
  'require("%s");';

var createRequireFilePreprocessor = function(logger, basePath) {
  var log = logger.create('preprocessor.requirefile');

  return function(content, file, done) {
    log.debug('Processing "%s".', file.originalPath);

    done(util.format(TEMPLATE, file.originalPath)); //replace file contents with a require call
  };
};

createRequireFilePreprocessor.$inject = ['logger', 'config.basePath'];

//  node-di definition
module.exports = {
  'preprocessor:requirefile': ['factory', createRequireFilePreprocessor]
};
