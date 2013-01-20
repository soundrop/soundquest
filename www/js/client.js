define(["soundrop", "soundrop.spotify"], function(soundrop) {
    function randomId() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for(var i = 0; i < 40; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            return text;
    }

    function getTracks(playback, items) {
        var current, upcoming;
        if (playback) {
            var startIndex;
            var currentId = playback.item._id;
            for (var i = 0; i != items.length; i++) {
                if (items[i]._id === currentId) {
                    startIndex = i;
                    break;
                }
            }

            var size = items.length;
            current = items[startIndex];
            upcoming = [];
            for (var i = startIndex + 1; i != startIndex + size; i++)
                upcoming.push(items[i % size]);
        } else {
            current = null;
            upcoming = items.slice(0);
        }

        var itemUris = function(item) {
            var uris = [];
            var sources = item.track.sources;
            for (var i = 0; i != sources.length; i++)
                uris.push.apply(uris, sources[i].uris);
            return uris;
        };
        var itemLength = function(item) {
            var source = item.track.sources.filter(function (source) {
                return source.uris.some(function (uri) {
                    return uri === item.uri;
                });
            })[0];
            return source.length;
        };

        var tracks = [];
        if (current) {
            tracks.push({
                uris: itemUris(current),
                length: itemLength(current)
            });
            for (var i = 0; i != items.length; i++) {
                var item = items[i];
                tracks.push({
                    uris: itemUris(item),
                    length: itemLength(item)
                });
            }
        }

        return tracks;
    }

    var Client = Class.extend({
        init: function(host, clientId) {
            this.host = host;
            this.clientId = clientId;

            this.client = null;
            this.spaceId = null;
            this.space = null;

            this.connected_callback = null;
            this.disconnected_callback = null;
            this.chat_callback = null;

            var playback = new soundrop.spotify.Playback();
            this.playback = playback.pushContext('current');
            this.playback.callbacks.onPlaying = function (track) {};
            this.playback.callbacks.onPaused = function (reason) {};
            this.playback.callbacks.onStopped = function () {};
        },

        connect: function(credentials) {
            var options = {
                host: this.host,
                client: {
                    _id: this.clientId,
                    instance: randomId(),
                    version: "0.1", /* FIXME */
                    country: "SE", /* FIXME */
                    language: "en" /* FIXME */
                },
                user: credentials
            };
            this.client = new soundrop.Client(options);
            this.client.on('connect', function() {
                if(this.connected_callback) {
                    var userId, displayName;
                    if(this.client.isAuthenticated()) {
                        userId = this.client.user.get('_id');
                        displayName = this.client.user.get('display_name');
                    }
                    else {
                        userId = randomId();
                        displayName = "Anonymous Coward";
                    }
                    this.connected_callback(userId, displayName);
                }
            }.bind(this));
            this.client.connect();
        },

        joinSpace: function(spaceId) {
            if(spaceId !== this.spaceId) {
                this.leaveSpace();

                this.spaceId = spaceId;
                this.space = null;

                this.client.spaces.get(spaceId).done(function(space) {
                    if(this.spaceId === spaceId) {
                        this.space = space;

                        space.join().done(function() {
                            var playlist = space.getApplication('soundrop:playlist');
                            var sync = function() {
                                playlist.items.get().done(function(items) {
                                    var tracks = getTracks(playlist.playback, items);
                                    this.playback.sync(tracks, playlist.playback.started);
                                }.bind(this));
                            }.bind(this);
                            playlist.on('sync', sync);
                            playlist.on('play', sync);
                        }.bind(this));
                    }
                    else {
                        this.client.spaces.unget(spaceId);
                    }
                }.bind(this));
            }
        },

        leaveSpace: function() {
            if(this.space) {
                this.client.spaces.unget(this.spaceId);

                this.space.leave();
                this.space = null;
                this.playback.sync([]);
            }
            this.spaceId = null;
        },

        sendChat: function(message) {
        },

        onConnected: function(callback) {
            this.connected_callback = callback;
        },

        onDisconnected: function(callback) {
            this.disconnected_callback = callback;
        },

        onChatMessage: function(callback) {
            this.chat_callback = callback;
        },
    });

    return Client
});
