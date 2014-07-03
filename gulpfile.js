var path = require('path');
var fs = require('fs');
var gulp = require('gulp');
var karma = require('gulp-karma');
var glob = require('glob');
var parcelify = require('parcelify');


var outputDir = path.join(path.resolve('./example'), 'output');

gulp.task('outputdir', function (done) {
  fs.mkdir(outputDir, function (err) {
    if (err.code == 'EEXIST') done();
    else done(err);
  });
})

gulp.task('build', ['outputdir'], function(done) {
  parcelify('./example/foo', {
    bundles: {
      script : path.join(outputDir, 'bundle.js'),  // send browserify output here (special cased)
      style : path.join(outputDir, 'bundle.css'),  // bundle `style` assets and output here
    },
  })  
    .on('browserifyInstanceCreated', function(browserifyInstance) {

    })
    .on('done', done) 
    .on('error', function(err) { throw err; })
});

gulp.task('build:test', ['outputdir'], function(done) {
  parcelify('./null', {
    browserifyOptions: {
      fullPaths: true,
    },
    bundles: {
      script : path.join(outputDir, 'test-bundle.js'),  // send browserify output here (special cased)
      style : path.join(outputDir, 'test-bundle.css'),  // bundle `style` assets and output here
    },
  })
    .on('browserifyInstanceCreated', function(browserifyInstance) {
      glob.sync('./**/__test__/*.js').forEach(function(filepath) {
        var modulePath = require.resolve(filepath);
        browserifyInstance.require(modulePath, {expose: modulePath});
      });
    })
    .on('done', done) 
    .on('error', function(err) { throw err; })
});

gulp.task('test', ['build:test'], function() {
  // Be sure to return the stream
  return gulp.src('./**/__test__/*.js')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }))
    .on('error', function(err) { throw err; });
});
