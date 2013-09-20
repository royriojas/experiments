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

    autoprefixer: {
      options: {
        browsers: ['last 1 version']
      },
      dist: {
        files: [{
          expand: true,
          cwd: './dist/',
          src: '{,*/}*.css',
          dest: './dist/'
        }]
      }
    },

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

            var regexEmCalc = /\bem-calc\((.*)\)/g;

            content = content.replace(regexEmCalc, function (a,b) {
              var number = parseFloat(b);
              if (!isNaN(number)) {
                return lib.format('{0}em',number/16);
              }
              throw new Error("em-calc expects a number!");
            });

            var animNamePattern = 'gen-anim-';

            var regexPseudoRule = /-anim-name:(.*);/gi;
            //var matches = content.match(regexPseudoRule);
            //console.log(matches);
            var animationsToCreate = [];
            var freeContent = content.replace(regexPseudoRule, function (a, b) {
              var params = lib.trim(b).split(' ');
              var animName = animNamePattern + (animationsToCreate.length);
              params.unshift(animName);
              console.log(params);

              var animRule = lib.format.apply(lib, ['animation: {0} {2} {3} {4};\n'].concat(params));

              animationsToCreate.push(params);

              return lib.format('/*{0}*/\n{1}', a, animRule);
            });

            var renderedContent = '/*! ANIMATIONS */\n\n';

            for (var i = 0, len = animationsToCreate.length; i < len; i++) {
              var anim = animationsToCreate[i];

              // TODO: add proper parsing of the values
              if (anim.length !== 5) {
                throw new Error('The number of parameters to create the animation are wrong');
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
    },

    spriteGenerator: {
//      'avatar-idle' : {
//        src: [
//          BASE_SOURCE_DIR + 'image-sequences/avatar/idle/*.png'
//        ],
//        layout : 'horizontal',
//        spritePath: BASE_SOURCE_DIR + 'less/assets/generated/a vatar-idle.png',
//        stylesheet : 'css',
//        stylesheetPath: BASE_SOURCE_DIR + 'less/assets/generated/avatar-idle.css'
//      },
//      'avatar-walk-right' : {
//        src: [
//          BASE_SOURCE_DIR + 'image-sequences/avatar/walk-right/*.png'
//        ],
//        layout: 'horizontal',
//        spritePath: BASE_SOURCE_DIR + 'less/assets/generated/avatar-walk-right.png',
//        stylesheet: 'css',
//        stylesheetPath: BASE_SOURCE_DIR + 'less/assets/generated/avatar-walk-right.css'
//      },
//      'avatar-walk-left': {
//        src: [
//          BASE_SOURCE_DIR + 'image-sequences/avatar/walk-left/*.png'
//        ],
//        layout: 'horizontal',
//        spritePath: BASE_SOURCE_DIR + 'less/assets/generated/avatar-walk-left.png',
//        stylesheet: 'css',
//        stylesheetPath: BASE_SOURCE_DIR + 'less/assets/generated/avatar-walk-left.css'
//      },
//      'avatar-walk-forward': {
//        src: [
//          BASE_SOURCE_DIR + 'image-sequences/avatar/walk-forward/*.png'
//        ],
//        layout: 'horizontal',
//        spritePath: BASE_SOURCE_DIR + 'less/assets/generated/avatar-walk-forward.png',
//        stylesheet: 'css',
//        stylesheetPath: BASE_SOURCE_DIR + 'less/assets/generated/avatar-walk-forward.css'
//      },
//      'avatar-cape': {
//        src: [
//          BASE_SOURCE_DIR + 'image-sequences/avatar/cape/*.png'
//        ],
//        layout: 'horizontal',
//        spritePath: BASE_SOURCE_DIR + 'less/assets/generated/avatar-cape.png',
//        stylesheet: 'css',
//        stylesheetPath: BASE_SOURCE_DIR + 'less/assets/generated/avatar-cape.css'
//      }

    },

    exec : {
      prebuild : {
        command: 'mkdir -p src/less/assets/generated',
        stdout: true,
        stderr: true,
        failOnError: true
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
    "grunt-contrib-copy",
    "grunt-contrib-qunit",
    "grunt-contrib-htmlmin",
    "grunt-autoprefixer",
    "node-sprite-generator"
  ];

  npmTasks.forEach(function(task) {
    grunt.loadNpmTasks(task);
  });

  grunt.initConfig(cfg);

  var IMAGE_SEQUENCES_DIR = BASE_SOURCE_DIR + 'image-sequences/';
  var OUTPUT_SEQUENCES_DIR = BASE_SOURCE_DIR + 'less/assets/generated/';

  var getDirsUnderPath = function (p) {
    var folders = gruntFile.expand(path.join(p, '*')).filter(function (entry) {
      return gruntFile.isDir(entry);
    });
    return folders;
  };

  var getAnimGroups = function (p) {
    var folders = getDirsUnderPath(p);
    var animGroups = folders.map(function (ele) {
      return {
        name: path.basename(ele),
        animations: getDirsUnderPath(ele).map(function (animDir) {
          return { name : path.basename(animDir), path : animDir };
        })
      };
    });
    return animGroups;
  };

  gruntTaskUtils.createSpriteAnimations = function (cfg, imageSequencesPath, outputSequencesPath) {
    var animGroups = getAnimGroups(imageSequencesPath);
    animGroups.forEach(function (ele){
      var animations = ele.animations;
      if (animations) {
        var prefix = ele.name;
        animations.forEach(function (sprite) {
          var taskName = lib.format('{0}-{1}', prefix, sprite.name);
          var spriteGenerator = cfg.spriteGenerator || (cfg.spriteGenerator = {});
          spriteGenerator[taskName] = {
            src : [path.join(sprite.path + '/*.png')],
            layout : 'horizontal',
            spritePath : path.join(outputSequencesPath, taskName + '.png'),
            stylesheet: 'css',
            stylesheetPath: path.join(outputSequencesPath, taskName + '.css')
          };
        });
      }
    });
  };

  gruntTaskUtils.createSpriteAnimations(cfg, IMAGE_SEQUENCES_DIR, OUTPUT_SEQUENCES_DIR);
  gruntTaskUtils.createJSAndCSSTasks(cfg, filesToProcess);

  var tasksDefinition = {
    'banner': function() {
      gruntFile.write(bannerOuputPath, grunt.config('meta.banner'));
    },
    'create-sprites' : function () {
      gruntTaskUtils.createSpriteAnimations(cfg, IMAGE_SEQUENCES_DIR, OUTPUT_SEQUENCES_DIR);
    },

    'validate-templates': function() {
      var templateFiles = gruntFile.expand([JS_CODE_DIR + '**/*.doT', animationTemplatePath]);
      gruntTaskUtils.validateTemplates(templateFiles);
    },

    'js': ["jshint", "preprocess", "uglify"],
    'css': ['cLess', 'copy:prefixAnim', 'autoprefixer', 'cssmin'],
    'dev-build': ['validate-templates', 'clean', 'exec:prebuild', 'spriteGenerator', 'banner', 'css', 'js'],
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