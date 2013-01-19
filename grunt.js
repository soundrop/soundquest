/*global module:false*/
module.exports = function(grunt) {
    grunt.initConfig({
        requirejs: {
            rel: {
                options: {
                    modules: [{
                        name: 'main'
                    }],
                    dir: "build/www",
                    appDir: "www",
                    baseUrl: ".",
                    paths: {
                        'text':          "js/lib/require/text",
                        'jquery':        "js/lib/jquery/jquery",
                        'main':          "js/main",
                        'app':           "js/app"
                    },
                    shim: {
                        'jquery':       { exports: 'jQuery' },
                    },

                    optimizeAllPluginResources: true,
                    optimize: 'uglify',
                    uglify: { mangle: true },
                    stubModules: [ 'text' ],
                    almond: true,
                    replaceRequireScript: [{
                        files: ["build/www/index.html"],
                        module: 'main',
                        modulePath: '/js/main'
                    }],

                    fileExclusionRegExp: /^(\..+|build|grunt\.js|node_modules)$/,
                    pragmas: { productionExclude: true },
                    preserveLicenseComments: false,
                    useStrict: true
                }
            }
        },
        server: {
            dev: { root: "www" },
            rel: { root: "build/www" }
        }
    });

    grunt.loadNpmTasks('grunt-requirejs');
    grunt.registerTask('default', 'requirejs trim');

    grunt.registerTask('trim', "Trim for packaging.", function() {
        var fs = require('fs');
        var path = require('path');
        var targets = grunt.config(['requirejs']);

        function rmTreeSync(name) {
            if (!fs.existsSync(name))
                return;

            if (fs.statSync(name).isDirectory()) {
                fs.readdirSync(name).forEach(function(file) {
                    rmTreeSync(path.join(name, file));
                });
                fs.rmdirSync(name);
            } else {
                fs.unlinkSync(name);
            }
        };

        for (var target in targets) {
            var dir = targets[target].options.dir;
            rmTreeSync(path.join(dir, "build.txt"));
            rmTreeSync(path.join(dir, "css", "lib"));
            rmTreeSync(path.join(dir, "css", "app"));
            rmTreeSync(path.join(dir, "css", "app.less"));
            rmTreeSync(path.join(dir, "js", "lib"));
            rmTreeSync(path.join(dir, "js", "app"));
            rmTreeSync(path.join(dir, "js", "app.coffee"));
            rmTreeSync(path.join(dir, "i18n"));
            rmTreeSync(path.join(dir, "html"));
        }
    });

    grunt.registerMultiTask('server', "Start a devmode-friendly web server.", function() {
        var root = grunt.config(['server', this.target, 'root']) || "www";
        var port = grunt.config(['server', this.target, 'port']) || 8000;
        var done = this.async();

        var connect = require('connect');
        var path = require('path');
        grunt.log.writeln("Serving files from: " + path.join(__dirname, root));

        connect()
            .use(connect.logger({ format: 'dev' }))
            .use(connect.static(path.join(__dirname, root)))
            .listen(port);

        grunt.log.writeln("Hit ENTER to finish.");
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', function(line) {
            process.stdin.pause();
            done();
        });
    });
};
