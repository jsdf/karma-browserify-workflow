var path = require('path');
var fs = require('fs');
var gulp = require('gulp');
var karma = require('gulp-karma');
var glob = require('glob');
var browserify = require('browserify');
var watchify = require('watchify');
var parcelify = require('parcelify');
var _ = require('underscore');

var outputDir = path.join(path.resolve('./example'), 'output');

gulp.task('prebuild', function (done) {
  createOutputDir(done)
})

gulp.task('build', ['prebuild'], buildTask)

gulp.task('watch:build', ['prebuild'], function(done) {
  var bundler = createBundler({
    bundleName: 'bundle',
    main: './example/foo',
    watch: true,
  })
  var assetBundler = addAssetBundler(bundler)
})
gulp.task('watch:test', ['prebuild'], function(done) {
  watchAndRunTests(done)
})

gulp.task('test', ['prebuild'], function(done) {
  var opts = {
    bundleName: 'test-bundle',
  }

  var bundler = createBundler(opts)

  var outputFilePath = path.join(outputDir, opts.bundleName+'.js')

  var testFiles = bundlerAddTests(bundler)

  bundler.bundle()
    .pipe(fs.createWriteStream(outputFilePath))
    .on('close', function () {
      runTestsOnce(outputFilePath, testFiles, done)
    }) 
    .on('error', done)
});

function createOutputDir (done) {
  fs.mkdir(outputDir, function (err) {
    if (err.code == 'EEXIST') done();
    else done(err);
  });  
}

function buildTask(done) {
  var bundler = createBundler({
    bundleName: 'bundle',
    main: './example/foo',
  })
  var assetBundler = addAssetBundler(bundler)
    .on('done', done) 
    .on('error', done)
}

function bundlerAddTests(bundler) {
  var testFiles = glob.sync('./**/__test__/*.js').map(function (filepath) {
    return require.resolve(filepath);
  })

  testFiles.forEach(function(modulePath) {
    bundler.require(modulePath, {expose: modulePath});
  })
  return testFiles
}


function watchAndRunTests(done) {
  var opts = {
    bundleName: 'test-bundle',
    watch: true,
  }
  var outputFilePath = path.join(outputDir, opts.bundleName+'.js')
  var bundler = createBundler(opts)

  var testFiles = bundlerAddTests(bundler)

  bundler
    .on('update', function (updatedIds) {
      console.log('update', updatedIds)
      bundler.bundle()
        .on('close', function () {
          console.log('update done')
          runTestsWatch(outputFilePath, _.intersection(updatedIds, testFiles), done)
        })
        .pipe(fs.createWriteStream(outputFilePath))
    })

  bundler.bundle()
    .pipe(fs.createWriteStream(outputFilePath))
    .on('close', function () {
      console.log('done')
      runTestsWatch(outputFilePath, testFiles, done)
    })
}

function runTestsWatch(testBundle, testFiles, done) {
  console.log('running', testFiles)
  return gulp.src([].concat(testBundle, testFiles))
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }))
    .on('error', done)
}

function runTestsOnce(testBundle, testFiles, done) {  
  return gulp.src([].concat(testBundle, testFiles))
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('close', done)
    .on('error', done)
}

function createBundler(opts) {
  opts = opts || {};
  if (opts.watch) console.log('watch')
  var bundler = (opts.watch ? watchify : browserify)(opts)
  bundler.bundleOpts = opts
  bundler
    .on('log', function(msg) { console.log(msg) })
  return bundler
}

function addAssetBundler(bundler, opts) {
  opts = opts || bundler.bundleOpts || {};

  return parcelify(opts.main || './null', {
    browserifyInstance: bundler,
    bundles: {
      script : path.join(outputDir, opts.bundleName+'.js'),  // send browserify output here (special cased)
      style : path.join(outputDir, opts.bundleName+'.css'),  // bundle `style` assets and output here
    },
  })
}
