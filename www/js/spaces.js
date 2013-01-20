define(["area"], function(Area) {
    var SpaceManager = Class.extend({
        init: function(game) {

            this.game = game;
            this.currentSpaceId = null;
            this.areas = [];

            this.spaceIds = {
                "village": "VhzLPcWDnXhakl0c",
                "forest": "VhzLPcWDnXhakl0a",
                "beach": "VqE1Yk4y4PpnPxnE",
            };
        },

        addArea: function(x, y, width, height, areaId) {
            var area = new Area(x, y, width, height);
            area.id = areaId;
            this.areas.push(area);
        },

        updateSpace: function() {
            var spaceId = this.getCurrentSpace(this.game.player);
            if(spaceId) {
                if(spaceId !== this.currentSpaceId) {
                    this.currentSpaceId = spaceId;
                    this.game.client.joinSpace(spaceId);
                }
            }
            else {
                this.game.client.leaveSpace();
                this.currentSpaceId = null;
            }
        },

        getCurrentSpace: function(entity) {
            var space = null,
                area = _.detect(this.areas, function(area) {
                    return area.contains(entity);
                });
            if(area) {
                return this.spaceIds[area.id];
            }
        },
    });
    return SpaceManager;
});
