define(function() {
    var Detect = {};

    Detect.userAgentContains = function(string) {
        return navigator.userAgent.indexOf(string) != -1;
    };

    Detect.isWindows = function() {
        return Detect.userAgentContains('Windows');
    }

    Detect.isChromeOnWindows = function() {
        return Detect.userAgentContains('Chrome') && Detect.userAgentContains('Windows');
    };

    return Detect;
});
