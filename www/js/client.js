define(function() {
    var Client = Class.extend({
        init: function(host, clientId, clientInstance) {
            this.connected_callback = null;
            this.disconnected_callback = null;
            this.chat_callback = null;
        },

        connect: function(credentials) {
            if(this.connected_callback) {
                self.connected_callback("sessionId", "John Doe");
            }
        },

        join: function(spaceId) {
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
