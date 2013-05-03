/*global module:false*/
module.exports = function(grunt) {
    grunt.initConfig({
        requirejs: {
            modules: [{
                name: 'main'
            }],
            dir: "build/www",
            appDir: "www",
            baseUrl: "./js",
            paths: {
                'class':            "lib/class",
                'text':             "lib/require.text",
                'jquery':           "lib/jquery",
                'underscore':       "lib/underscore",
                'astar':            "lib/astar",
                'soundrop':         "lib/soundrop",
                'soundrop.spotify': "lib/soundrop.spotify"
            },
            shim: {
                'jquery':           { exports: 'jQuery' },
                'soundrop':         { exports: 'soundrop' },
                'soundrop.spotify': { exports: 'soundrop.spotify' }
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

        var dir = grunt.config(['requirejs']).dir;
        rmTreeSync(path.join(dir, "build.txt"));
        fs.readdirSync(path.join(dir, "js")).filter(function (filename) {
            return filename !== "main.js";
        }).forEach(function (filename) {
            var f = path.join(dir, "js", filename);
            if (fs.statSync(f).isFile()) {
                fs.unlinkSync(f);
            }
        });
        fs.readdirSync(path.join(dir, "js", "lib")).filter(function (filename) {
            return filename !== "log.js";
        }).forEach(function (filename) {
            rmTreeSync(path.join(dir, "js", "lib", filename));
        });
        rmTreeSync(path.join(dir, "sprites"));
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
