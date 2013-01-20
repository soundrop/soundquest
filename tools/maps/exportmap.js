#!/usr/bin/env node

var util = require('util'),
    Log = require('log'),
    path = require("path"),
    fs = require("fs"),
    processMap = require('./processmap'),
    log = new Log(Log.DEBUG);
    
var source = process.argv[2],
    destination = process.argv[3];

if(!source || !destination) {
    util.puts("Usage : ./exportmap.js map_file json_file");
    process.exit(0);
}

function main() {
    getTiledJSONmap(source, function(json) {
        var options = {mode: "client"},
            map = processMap(json, options);
        
        var jsonMap = JSON.stringify(map); // Save the processed map object as JSON data
        jsonMap = "var mapData = "+JSON.stringify(map);
        fs.writeFile(destination, jsonMap, function(err, file) {
            log.info("Finished processing map file: "+ destination + " was saved.");
        });
    });
}

// Loads the temporary JSON Tiled map converted by tmx2json.py
function getTiledJSONmap(filename, callback) {
    var self = this;
    
    path.exists(filename, function(exists) {
        if(!exists) {  
            log.error(filename + " doesn't exist.")
            return;
        }
    
        fs.readFile(source, function(err, file) {
            callback(JSON.parse(file.toString()));
        });
    });
}

main();
