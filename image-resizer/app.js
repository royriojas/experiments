var grunt = require('grunt'),
  imageResizer = require('./imageResizer.js'),
  files = grunt.file.expand('./some/path/assets/**/*{.png,.gif,.jpg}');

var dfd = imageResizer.process(files, {
  outputFolder : './some/path/g_assets', 
  relativePath : './some/path/assets', 
  maxConcurrent : 20,
  sizes : [25, 50, 75]
});

dfd.progress(function (args) {
  console.log('processing',args.file);
});

dfd.done(function () {
  console.log('processing done!');
});

