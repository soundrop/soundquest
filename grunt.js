/*global module:false*/
module.exports = function(grunt) {
    grunt.initConfig({
        server: {
            dev: { root: "client-build" }
        }
    });
    grunt.registerTask('default', 'server');
    grunt.registerMultiTask('server', "Start a devmode-friendly web server.", function() {
        var root = grunt.config(['server', this.target, 'root']) || "www";
        var port = grunt.config(['server', this.target, 'port']) || 8001;
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
