module.exports = function(grunt) {
  'use strict';

  var path = require('path'),
    lib = require('grunt-r3m/lib/lib.js'),
    pkg = require('./package.json'),
    verbose = grunt.verbose,
    format = lib.format,
    gruntFile = grunt.file,
    cheerio = require('cheerio'),
    doT = require('dot');


  //region Base Folders
  var
    BASE_RESOURCES = '',

    BASE_FOLDER = BASE_RESOURCES + './',

    // The base directory where the app code is
    BASE_SOURCE_DIR = BASE_FOLDER + 'src/',

    // The base directory where the javascript files are
    JS_CODE_DIR = BASE_SOURCE_DIR + 'js/',

    // The base directory for the image resources
    IMG_FOLDER = BASE_SOURCE_DIR + 'img/',

    // The base code where the CSS for this app is
    LESS_CODE_DIR = BASE_SOURCE_DIR + 'less/',

    // The default directory in the public folder where all the files are going to be copied
    BASE_DEPLOY_PATH = BASE_RESOURCES + "dist/",

    JS_DEPLOY_PATH = BASE_DEPLOY_PATH + 'js/',

    CSS_DEPLOY_PATH = BASE_DEPLOY_PATH + 'css/',

    IMG_FOLDER_DEPLOY_PATH = BASE_DEPLOY_PATH + '/img/';


  //endregion

  var gruntTaskUtils = require('grunt-r3m/lib/grunt-task-utils.js')(grunt);

  var bannerSource = BASE_FOLDER + 'license.banner.txt';
  var bannerOuputPath = BASE_DEPLOY_PATH + 'license.txt';
  var bannerContent = gruntFile.read(bannerSource);

  var animationTemplatePath = BASE_FOLDER + 'animation.doT';
  var animationTemplateFn;

  var filesToProcess = [
    {
      src : [ bannerOuputPath, JS_CODE_DIR + 'main.js' ],
      dest : JS_DEPLOY_PATH + 'main.js'
    },
    {
      src : [ bannerOuputPath, LESS_CODE_DIR + 'main.less'],
      dest : CSS_DEPLOY_PATH + 'main.css'
    }
  ];



  // Project configuration.
  var cfg = {
    pkg: pkg,
    meta: {
      banner: bannerContent
    },
    jshint: {
      develFiles: {
        files: {
          src: ['Gruntfile.js', JS_CODE_DIR + '**/*.js' ]
        },
        options: {

          curly: true,
          eqeqeq: true,
          immed: true,
          latedef: true,
          newcap: true,
          noarg: true,
          sub: true,
          undef: true,
          boss: true,
          eqnull: true,
          browser: true,
          expr: true,
          laxcomma: true,
          multistr: true,
          globals: {
            jQuery: true,
            kno: true,
            doT: true,
            Element: true,
            require: true,
            module : true,
            console : true
          }
        }
      }
    },

    preprocess: {
      options: {
        tokenRegex: /\[\[\s*(\w*)\s*([\w="'-.\/\s]*)\s*\]\]/gi
      }
    },

    uglify: {
      options : {
        banner : bannerContent
      }
    },
    cLess: {},

    copy: {

      prefixAnim : {
        files : [{
          src: ['**/*.css'],
          dest: CSS_DEPLOY_PATH,
          cwd: CSS_DEPLOY_PATH,
          expand: true
        }],
        options: {
          processContent : function (content, pathToFile) {

            animationTemplateFn = animationTemplateFn || doT.template(gruntFile.read(animationTemplatePath));

            var regexPseudoRule = /-anim-name:(.*);/gi;
            //var matches = content.match(regexPseudoRule);
            //console.log(matches);
            var animationsTocreate = [];
            var freeContent = content.replace(regexPseudoRule, function (a, b) {
              animationsTocreate.push(b);
              return lib.format('/*{0}*/', a);
            });

            var renderedContent = '/*! ANIMATIONS */\n\n';

            for (var i = 0, len = animationsTocreate.length; i < len; i++) {
              var anim = lib.trim(animationsTocreate[i]).split(' ');

              // TODO: add proper parsing of the values
              if (anim.length !== 2) {
                throw new Error('missing proper parameters');
              }

              var obj = {
                animationName : anim[0],
                maxDisplacement : anim[1]
              };

              renderedContent += animationTemplateFn(obj);
            }



            return freeContent + renderedContent;

          }
        }
      },

      dev: {
        files: [{
          src: ['**/*.html'],
          dest: BASE_DEPLOY_PATH,
          cwd: BASE_SOURCE_DIR,
          expand: true
        }],
        options: {
          processContent: function(content, pathToFile) {
            var c = content.replace('[APP_VERSION]', pkg.version);//processContent(content);
            
            return c;
          }
        }
      }, 
      prod: {
        files: [{
          src: ['**/*.html'],
          dest: BASE_DEPLOY_PATH,
          cwd: BASE_SOURCE_DIR,
          expand: true
        }],
        options: {
          processContent: function(content, pathToFile) {
            var c = content.replace('[APP_VERSION]', pkg.version);//processContent(content);
            var $ = cheerio.load(c);
            $('script[src]').each(function () {
              var $this = $(this);
              var src = $this.attr('src');
              if ($this.is('[data-skip]')) {
                return true;
              }
              $this.attr('src', gruntTaskUtils.createMinFromRegular(src));
            });
            $('link[rel="stylesheet"]').each(function () {
              var $this = $(this);
              var href = $this.attr('href');
              if ($this.is('[data-skip]')) {
                return true;
              }
              $this.attr('href', gruntTaskUtils.createMinFromRegular(href));
            });
            //console.log($);
            return $.html();
            
          }
        }
      },
      vendors : {
        files : [{
          src: ['vendors/**/*.*'],
          dest : BASE_DEPLOY_PATH,
          cwd : BASE_SOURCE_DIR,
          expand : true
        }]
      }
    },

    clean : {
      build : [BASE_DEPLOY_PATH]
    },

    htmlmin: { // Task
      prod: { // Target
        options: { // Target options
          removeComments: true,
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeRedundantAttributes: true
        },
        files: { 
          src : BASE_DEPLOY_PATH + 'index.html',
          dest : BASE_DEPLOY_PATH + 'index.html'
        }
      }
    },

    watch: {
      less: {
        files: [
          LESS_CODE_DIR + '/**/*.less'
        ],
        tasks: 'css'
      },
      js: {
        files: [
          JS_CODE_DIR + '/**/*.js'
        ],
        tasks: 'js'
      }
    }
  };

  var npmTasks = [
    "grunt-exec",
    "grunt-r3m",
    "grunt-contrib-clean",
    "grunt-contrib-jshint",
    "grunt-contrib-uglify",
    "grunt-contrib-watch",
    "grunt-contrib-cssmin",
    'grunt-contrib-copy',
    'grunt-contrib-qunit',
    "grunt-contrib-htmlmin"
  ];

  npmTasks.forEach(function(task) {
    grunt.loadNpmTasks(task);
  });

  grunt.initConfig(cfg);

  gruntTaskUtils.createJSAndCSSTasks(cfg, filesToProcess);

  var tasksDefinition = {
    'banner': function() {
      gruntFile.write(bannerOuputPath, grunt.config('meta.banner'));
    },

    'validate-templates': function() {
      var templateFiles = gruntFile.expand([JS_CODE_DIR + '**/*.doT', animationTemplatePath]);
      gruntTaskUtils.validateTemplates(templateFiles);
    },

    'js': ["jshint", "preprocess", "uglify"],
    'css': ['cLess', 'copy:prefixAnim', 'cssmin'],
    'dev-build': ['validate-templates', 'clean', 'banner', 'css', 'js'],
    'dev' : ['dev-build', 'copy:dev'],
    'prod' : ['dev-build', 'copy:prod'],
    'default': ['dev']
  };

  for (var taskName in tasksDefinition) {
    if (tasksDefinition.hasOwnProperty(taskName)) {
      var task = tasksDefinition[taskName];
      grunt.registerTask(taskName, task);
    }
  }

};