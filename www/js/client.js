define(["soundrop"], function(soundrop) {
    function randomId() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for(var i = 0; i < 40; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            return text;
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
                        userId = randomId;
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
                            playlist.on('play', function(item, offset) {
                                console.log('playing: ' + item.uri + ', at: ' + offset);
                            });
                            playlist.on('sync', function() {
                                var itemId = playlist.playback.item._id;
                                var offset = new Date().getTime() - playlist.playback.started.getTime();
                                playlist.items.get().done(function(items) {
                                    var item = _.find(items, function(item) {return item._id === itemId;});
                                    console.log('playing(sync): ' + item.uri + ', at: ' + offset);
                                });
                            });
                        });
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
