define(function() {

    var Storage = Class.extend({
        init: function() {
            if(localStorage.data) {
                this.data = JSON.parse(localStorage.data);
            } else {
                this.resetData();
            }
        },
    
        resetData: function() {
            this.data = {
                hasAlreadyPlayed: false
            };
        },
    
        save: function() {
            localStorage.data = JSON.stringify(this.data);
        },
    
        clear: function() {
            localStorage.data = "";
            this.resetData();
        },
    
        // Player
        hasAlreadyPlayed: function() {
            return this.data.hasAlreadyPlayed;
        },
    
        initPlayer: function() {
            this.data.hasAlreadyPlayed = true;
        }
    });
    
    return Storage;
});
