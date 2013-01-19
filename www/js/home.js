//>>excludeStart("productionExclude", pragmas.productionExclude);
requirejs.config({
    baseUrl: "/js",
    paths: {
        'class':        "lib/class",
        'text':         "lib/require.text",
        'jquery':       "lib/jquery",
        'underscore':   "lib/underscore"
    },
    shim: {
        'lcss':         { deps: ['less'] },
        'jquery':       { exports: 'jQuery' }
    }
});
//>>excludeEnd("productionExclude");
define(['class', 'util', 'gametypes'], function() {
    require(["main"]);
});
