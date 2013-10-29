var gmLib = require('gm'),
  fs = require('fs'),
  lib = require('grunt-ez-frontend/lib/lib.js'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  grunt = require('grunt'),
  async = require('async'),
  Deferred = require( "JQDeferred" );


gm = gmLib.subClass({ imageMagick : true });

var doResize = function (imagePath, outputFolder, relativePath, size) {
  
  var imgStream = fs.createReadStream(imagePath),
    dfd = Deferred();

  size = lib.trim(size);
  if (!size.match(/\bmedium\b|\bsmall\b/)) {
    throw new Error('Not a valid size. Choose medium or small');
  }
  var sizeInPercentage = 50, sizeInText = '_s_';

  if (size === 'medium') {
    sizeInPercentage = 75;
    sizeInText = '_m_';
  } 
  var basename = path.basename(imagePath);

  var outputPath = path.join(outputFolder, sizeInText, path.relative(relativePath, imagePath));

  mkdirp(path.dirname(outputPath), function (err) {

    if (err) {
      console.error('err', err);
    }

    gm(imgStream, basename)
      .resize(sizeInPercentage, sizeInPercentage, '%')
      .write(outputPath, function (err) {
        if (err) {
          console.error('err: ', err);
        }
        dfd.resolve();
      });

  });

  return dfd.promise();
};

var imageResizer = {
  
	resize: function (imagePath, outputFolder, relativePath, cb) {
   
    var d1 = doResize(imagePath, outputFolder, relativePath, 'medium');
    var d2 = doResize(imagePath, outputFolder, relativePath, 'small');

    Deferred.when(d1,d2).then(cb);
    
	},

  process : function (files, outputFolder, relativePath, limit) {
    async.eachLimit(files, limit || 25, function (file, cb) {
      //console.log('resizing file : ', file);
      imageResizer.resize(file, outputFolder, relativePath, cb);  
    }, function () {
      console.log('done!');
    });
  }

};

var files = grunt.file.expand('./some/path/assets/**/*{.png,.gif,.jpg}');

imageResizer.process(files, './some/path/g_assets', './some/path/assets', 30);

