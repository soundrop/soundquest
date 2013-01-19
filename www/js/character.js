define(['entity', 'transition', 'timer'], function(Entity, Transition, Timer) {

    var Character = Entity.extend({
        init: function(id, kind) {
            var self = this;
        
            this._super(id, kind);
            
            // Position and orientation
            this.nextGridX = -1;
            this.nextGridY = -1;
            this.orientation = Types.Orientations.DOWN;
        
            // Speeds
            this.moveSpeed = 120;
            this.walkSpeed = 100;
            this.idleSpeed = 450;
        
            // Pathing
            this.movement = new Transition();
            this.path = null;
            this.newDestination = null;
            this.adjacentTiles = {};

            this.target = null;
            this.unconfirmedTarget = null;
        },
    
        clean: function() {
        },
    
        setDefaultAnimation: function() {
            this.idle();
        },
    
        hasShadow: function() {
            return true;
        },
    
        animate: function(animation, speed, count, onEndCount) {
            var oriented = ['walk', 'idle'];
                o = this.orientation;
            
            this.flipSpriteX = false;
            this.flipSpriteY = false;
    
            if(_.indexOf(oriented, animation) >= 0) {
                animation += "_" + (o === Types.Orientations.LEFT ? "right" : Types.getOrientationAsString(o));
                this.flipSpriteX = (this.orientation === Types.Orientations.LEFT) ? true : false;
            }

            this.setAnimation(animation, speed, count, onEndCount);
        },
    
        turnTo: function(orientation) {
            this.orientation = orientation;
            this.idle();
        },
    
        setOrientation: function(orientation) {
            if(orientation) {
                this.orientation = orientation;
            }
        },
    
        idle: function(orientation) {
            this.setOrientation(orientation);
            this.animate("idle", this.idleSpeed);
        },
    
        walk: function(orientation) {
            this.setOrientation(orientation);
            this.animate("walk", this.walkSpeed);
        },
    
        moveTo_: function(x, y, callback) {
            this.destination = { gridX: x, gridY: y };
            this.adjacentTiles = {};
        
            if(this.isMoving()) {
                this.continueTo(x, y);
            }
            else {
                var path = this.requestPathfindingTo(x, y);
            
                this.followPath(path);
            }
        },
    
        requestPathfindingTo: function(x, y) {
            if(this.request_path_callback) {
                return this.request_path_callback(x, y);
            } else {
                log.error(this.id + " couldn't request pathfinding to "+x+", "+y);
                return [];
            }
        },
    
        onRequestPath: function(callback) {
            this.request_path_callback = callback;
        },
    
        onStartPathing: function(callback) {
            this.start_pathing_callback = callback;
        },
    
        onStopPathing: function(callback) {
            this.stop_pathing_callback = callback;
        },
    
        followPath: function(path) {
            if(path.length > 1) { // Length of 1 means the player has clicked on himself
                this.path = path;
                this.step = 0;
            
                if(this.start_pathing_callback) {
                    this.start_pathing_callback(path);
                }
                this.nextStep();
            }
        },

        continueTo: function(x, y) {
            this.newDestination = { x: x, y: y };
        },
    
        updateMovement: function() {
            var p = this.path,
                i = this.step;
        
            if(p[i][0] < p[i-1][0]) {
                this.walk(Types.Orientations.LEFT);
            }
            if(p[i][0] > p[i-1][0]) {
                this.walk(Types.Orientations.RIGHT);
            }
            if(p[i][1] < p[i-1][1]) {
                this.walk(Types.Orientations.UP);
            }
            if(p[i][1] > p[i-1][1]) {
                this.walk(Types.Orientations.DOWN);
            }
        },

        updatePositionOnGrid: function() {
            this.setGridPosition(this.path[this.step][0], this.path[this.step][1]);
        },

        nextStep: function() {
            var stop = false,
                x, y, path;
        
            if(this.isMoving()) {
                if(this.before_step_callback) {
                    this.before_step_callback();
                }
            
                this.updatePositionOnGrid();
            
                if(this.interrupted) { // if Character.stop() has been called
                    stop = true;
                    this.interrupted = false;
                }
                else {
                    if(this.hasNextStep()) {
                        this.nextGridX = this.path[this.step+1][0];
                        this.nextGridY = this.path[this.step+1][1];
                    }
            
                    if(this.step_callback) {
                        this.step_callback();
                    }
                
                    if(this.hasChangedItsPath()) {
                        x = this.newDestination.x;
                        y = this.newDestination.y;
                        path = this.requestPathfindingTo(x, y);
                
                        this.newDestination = null;
                        if(path.length < 2) {
                            stop = true;
                        }
                        else {
                            this.followPath(path);
                        }
                    }
                    else if(this.hasNextStep()) {
                        this.step += 1;
                        this.updateMovement();
                    }
                    else {
                        stop = true;
                    }
                }
            
                if(stop) { // Path is complete or has been interrupted
                    this.path = null;
                    this.idle();
                
                    if(this.stop_pathing_callback) {
                        this.stop_pathing_callback(this.gridX, this.gridY);
                    }
                }
            }
        },
    
        onBeforeStep: function(callback) {
            this.before_step_callback = callback;
        },
    
        onStep: function(callback) {
            this.step_callback = callback;
        },

        isMoving: function() {
            return !(this.path === null);
        },

        hasNextStep: function() {
            return (this.path.length - 1 > this.step);
        },

        hasChangedItsPath: function() {
            return !(this.newDestination === null);
        },
    
        isNear: function(character, distance) {
            var dx, dy, near = false;
        
            dx = Math.abs(this.gridX - character.gridX);
            dy = Math.abs(this.gridY - character.gridY);
        
            if(dx <= distance && dy <= distance) {
                near = true;
            }
            return near;
        },
    
        /**
         * Changes the character's orientation so that it is facing its target.
         */
        lookAtTarget: function() {
            if(this.target) {
                this.turnTo(this.getOrientationTo(this.target));
            }
        },
    
        /**
         * 
         */
        go: function(x, y) {
            this.moveTo_(x, y);
        },
    
        /**
         * Makes the character follow another one.
         */
        follow: function(entity) {
            if(entity) {
                this.moveTo_(entity.gridX, entity.gridY);
            }
        },
    
        /**
         * Stops a moving character.
         */
        stop: function() {
            if(this.isMoving()) {
                this.interrupted = true;
            }
        },
    
        /**
         * Gets the right orientation to face a target character from the current position.
         * Note:
         * In order to work properly, this method should be used in the following
         * situation :
         *    S
         *  S T S
         *    S
         * (where S is self, T is target character)
         * 
         * @param {Character} character The character to face.
         * @returns {String} The orientation.
         */
        getOrientationTo: function(character) {
            if(this.gridX < character.gridX) {
                return Types.Orientations.RIGHT;
            } else if(this.gridX > character.gridX) {
                return Types.Orientations.LEFT;
            } else if(this.gridY > character.gridY) {
                return Types.Orientations.UP;
            } else {
                return Types.Orientations.DOWN;
            }
        },
        
        /**
         * Sets this character's attack target. It can only have one target at any time.
         * @param {Character} character The target character.
         */
        setTarget: function(character) {
            if(this.target !== character) { // If it's not already set as the target
                if(this.hasTarget()) {
                    this.removeTarget(); // Cleanly remove the previous one
                }
                this.unconfirmedTarget = null;
                this.target = character;
            } else {
                log.debug(character.id + " is already the target of " + this.id);
            }
        },
    
        /**
         * Removes the current attack target.
         */
        removeTarget: function() {
            var self = this;
        
            if(this.target) {
                this.target = null;
            }
        },
    
        /**
         * Returns true if this character has a current attack target.
         * @returns {Boolean} Whether this character has a target.
         */
        hasTarget: function() {
            return !(this.target === null);
        },


        onHasMoved: function(callback) {
            this.hasmoved_callback = callback;
        },
    
        hasMoved: function() {
            this.setDirty();
            if(this.hasmoved_callback) {
                this.hasmoved_callback(this);
            }
        },
    });
    
    return Character;
});
