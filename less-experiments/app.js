var less = require('less');
var grunt = require('grunt');
var path = require('path');
var files = grunt.file.expand('./less/**/*.less');

less.tree.functions.demo = function () {
  //console.log('arguments',arguments, this);
  return { toCSS : function () { return 'demo here'; }};
};

//console.log(less);

files.forEach(function (file) {
  var parser = new less.Parser({
    paths : ".",
    filename : file
  });
  var content = grunt.file.read(file);
  parser.parse(content, function (e, tree) {
      if (e) {
        console.log(e);
        throw e;
      }
      var css = tree.toCSS({ compress: false }); // Minify CSS output
      grunt.file.write('./output/' + path.basename(file, '.less') + '.css', css);
  });
});

