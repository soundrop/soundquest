//>>excludeStart("productionExclude", pragmas.productionExclude);
requirejs.config({
    baseUrl: "./js",
    urlArgs: "_=" +  (new Date()).getTime(),
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
        'lcss':             { deps: ['less'] },
        'jquery':           { exports: 'jQuery' },
        'soundrop':         { exports: 'soundrop' },
        'soundrop.spotify': { exports: 'soundrop.spotify' }
    }
});
//>>excludeEnd("productionExclude");
define(['class', 'util', 'underscore'], function() {
    require(["main"]);
});
