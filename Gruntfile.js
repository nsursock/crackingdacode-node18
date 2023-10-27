module.exports = function (grunt) {

  grunt.initConfig({
    uglify: {
      options: {
        compress: {
          unused: true
        }
      },
      my_target: {
        files: {
          'dist/assets/_main.js': ['dist/assets/_main.js'],
        }
      }
    },
    critical: {
      dist: {
        options: {
          base: './',
          dimensions: [{
            width: 1300,
            height: 900
          },
          {
            width: 500,
            height: 900
          }]
        },
        files: [
          { src: ['dist/index.html'], dest: 'dist/index.html' }
        ]
      }
    }
  });

  // Load the plugins
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-critical');


  // Default tasks.
  grunt.registerTask('default', ['critical']);
};