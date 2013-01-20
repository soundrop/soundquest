define(['character'], function(Character) {

    var Player = Character.extend({
        init: function(id, name, kind) {
            this._super(id, kind);
        
            this.name = name;
        
            // Renderer
            this.nameOffsetY = -10;
        }
    });

    return Player;
});
