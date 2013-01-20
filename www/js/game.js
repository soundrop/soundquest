define(['bubble', 'renderer', 'map', 'animation', 'sprite', 'tile', 'updater',
        'transition', 'pathfinder', 'npc', 'player', 'character', 'client', 'spaces', 'config',
        'gametypes'], function(BubbleManager, Renderer, Map, Animation, Sprite, AnimatedTile,
         Updater, Transition, Pathfinder, Npc, Player, Character, Client, SpaceManager, config) {

    var Game = Class.extend({
        init: function(app) {
            this.app = app;
            this.app.config = config;
            this.ready = false;
            this.started = false;
            this.hasNeverStarted = true;
        
            this.renderer = null;
            this.updater = null;
            this.pathfinder = null;
            this.chatinput = null;
            this.bubbleManager = null;
            this.spaceManager = null;
        
            // Player
            this.player = new Player("player", "", Types.Entities.PLAYER);
    
            // Game state
            this.entities = {};
            this.entityGrid = null;
            this.pathingGrid = null;
            this.renderingGrid = null;
            this.currentCursor = null;
            this.mouse = { x: 0, y: 0 };
            this.zoningQueue = [];
            this.previousClickPosition = {};
    
            this.selectedX = 0;
            this.selectedY = 0;
            this.selectedCellVisible = false;
            this.targetColor = "rgba(255, 255, 255, 0.5)";
            this.targetCellVisible = true;
            this.hoveringTarget = false;
            this.hoveringCollidingTile = false;
        
            // zoning
            this.currentZoning = null;
        
            this.cursors = {};

            this.sprites = {};
        
            // tile animation
            this.animatedTiles = null;
        
            // debug
            this.debugPathing = false;
        
            // sprites
            this.spriteNames = ["hand", "sword", "loot", "target", "talk", "sparks", "shadow16", "rat", "skeleton", "skeleton2", "spectre", "boss", "deathknight", 
                                "ogre", "crab", "snake", "eye", "bat", "goblin", "wizard", "guard", "king", "villagegirl", "villager", "coder", "agent", "rick", "scientist", "nyan", "priest", 
                                "sorcerer", "octocat", "beachnpc", "forestnpc", "desertnpc", "lavanpc", "clotharmor", "leatherarmor", "mailarmor", 
                                "platearmor", "redarmor", "goldenarmor", "firefox", "death", "sword1", "axe", "chest",
                                "sword2", "redsword", "bluesword", "goldensword", "item-sword2", "item-axe", "item-redsword", "item-bluesword", "item-goldensword", "item-leatherarmor", "item-mailarmor", 
                                "item-platearmor", "item-redarmor", "item-goldenarmor", "item-flask", "item-cake", "item-burger", "morningstar", "item-morningstar", "item-firepotion"];
        },
    
        setup: function($bubbleContainer, canvas, background, foreground, input) {
            this.setBubbleManager(new BubbleManager($bubbleContainer));
            this.setRenderer(new Renderer(this, canvas, background, foreground));
            this.setChatInput(input);
        },
        
        setStorage: function(storage) {
            this.storage = storage;
        },
    
        setRenderer: function(renderer) {
            this.renderer = renderer;
        },

        setUpdater: function(updater) {
            this.updater = updater;
        },
    
        setPathfinder: function(pathfinder) {
            this.pathfinder = pathfinder;
        },
    
        setChatInput: function(element) {
            this.chatinput = element;
        },
    
        setBubbleManager: function(bubbleManager) {
            this.bubbleManager = bubbleManager;
        },

        loadMap: function() {
            var self = this;
    
            this.map = new Map(!this.renderer.upscaledRendering, this);
    
            this.map.ready(function() {
                log.info("Map loaded.");
                var tilesetIndex = self.renderer.upscaledRendering ? 0 : self.renderer.scale - 1;
                self.renderer.setTileset(self.map.tilesets[tilesetIndex]);
            });
        },
    
        initPlayer: function() {
            this.player.setSprite(this.sprites['clotharmor']);
            this.player.idle();
        
            log.debug("Finished initPlayer");
        },

        initShadows: function() {
            this.shadows = {};
            this.shadows["small"] = this.sprites["shadow16"];
        },

        initCursors: function() {
            this.cursors["hand"] = this.sprites["hand"];
            this.cursors["target"] = this.sprites["target"];
            this.cursors["arrow"] = this.sprites["arrow"];
            this.cursors["talk"] = this.sprites["talk"];
        },
    
        initAnimations: function() {
            this.targetAnimation = new Animation("idle_down", 4, 0, 16, 16);
            this.targetAnimation.setSpeed(50);
        
            this.sparksAnimation = new Animation("idle_down", 6, 0, 16, 16);
            this.sparksAnimation.setSpeed(120);
        },
    
        initSilhouettes: function() {
            var self = this;

            Types.forEachMobOrNpcKind(function(kind, kindName) {
                self.sprites[kindName].createSilhouette();
            });
        },

        loadSprite: function(name) {
            if(this.renderer.upscaledRendering) {
                this.spritesets[0][name] = new Sprite(name, 1);
            } else {
                this.spritesets[1][name] = new Sprite(name, 2);
                if(!this.renderer.limitedViewport) {
                    this.spritesets[2][name] = new Sprite(name, 3);
                }
            }
        },
    
        setSpriteScale: function(scale) {
            var self = this;
            
            if(this.renderer.upscaledRendering) {
                this.sprites = this.spritesets[0];
            } else {
                this.sprites = this.spritesets[scale - 1];
                
                _.each(this.entities, function(entity) {
                    entity.sprite = null;
                    entity.setSprite(self.sprites[entity.getSpriteName()]);
                });
                this.initShadows();
                this.initCursors();
            }
        },
    
        loadSprites: function() {
            log.info("Loading sprites...");
            this.spritesets = [];
            this.spritesets[0] = {};
            this.spritesets[1] = {};
            this.spritesets[2] = {};
            _.map(this.spriteNames, this.loadSprite, this);
        },
    
        spritesLoaded: function() {
            if(_.any(this.sprites, function(sprite) { return !sprite.isLoaded; })) {
                return false;
            }
            return true;
        },
    
        setCursor: function(name, orientation) {
            if(name in this.cursors) {
                this.currentCursor = this.cursors[name];
                this.currentCursorOrientation = orientation;
            } else {
                log.error("Unknown cursor name :"+name);
            }
        },
    
        updateCursorLogic: function() {
            if(this.hoveringCollidingTile && this.started) {
                this.targetColor = "rgba(255, 50, 50, 0.5)";
            }
            else {
                this.targetColor = "rgba(255, 255, 255, 0.5)";
            }
        
            if(this.hoveringNpc && this.started) {
                this.setCursor("talk");
                this.hoveringTarget = false;
                this.targetCellVisible = false;
            }
            else {
                this.setCursor("hand");
                this.hoveringTarget = false;
                this.targetCellVisible = true;
            }
        },
    
        focusPlayer: function() {
            this.renderer.camera.lookAt(this.player);
        },

        addEntity: function(entity) {
            var self = this;
            
            if(this.entities[entity.id] === undefined) {
                this.entities[entity.id] = entity;
                this.registerEntityPosition(entity);
                
                entity.fadeIn(this.currentTime);
            }
            else {
                log.error("This entity already exists : " + entity.id + " ("+entity.kind+")");
            }
        },

        removeEntity: function(entity) {
            if(entity.id in this.entities) {
                this.unregisterEntityPosition(entity);
                delete this.entities[entity.id];
            }
            else {
                log.error("Cannot remove entity. Unknown ID : " + entity.id);
            }
        },
    
        initPathingGrid: function() {
            this.pathingGrid = [];
            for(var i=0; i < this.map.height; i += 1) {
                this.pathingGrid[i] = [];
                for(var j=0; j < this.map.width; j += 1) {
                    this.pathingGrid[i][j] = this.map.grid[i][j];
                }
            }
            log.info("Initialized the pathing grid with static colliding cells.");
        },
    
        initEntityGrid: function() {
            this.entityGrid = [];
            for(var i=0; i < this.map.height; i += 1) {
                this.entityGrid[i] = [];
                for(var j=0; j < this.map.width; j += 1) {
                    this.entityGrid[i][j] = {};
                }
            }
            log.info("Initialized the entity grid.");
        },
    
        initRenderingGrid: function() {
            this.renderingGrid = [];
            for(var i=0; i < this.map.height; i += 1) {
                this.renderingGrid[i] = [];
                for(var j=0; j < this.map.width; j += 1) {
                    this.renderingGrid[i][j] = {};
                }
            }
            log.info("Initialized the rendering grid.");
        },
    
        /**
         * 
         */
        initAnimatedTiles: function() {
            var self = this,
                m = this.map;

            this.animatedTiles = [];
            this.forEachVisibleTile(function (id, index) {
                if(m.isAnimatedTile(id)) {
                    var tile = new AnimatedTile(id, m.getTileAnimationLength(id), m.getTileAnimationDelay(id), index),
                        pos = self.map.tileIndexToGridPosition(tile.index);
                    
                    tile.x = pos.x;
                    tile.y = pos.y;
                    self.animatedTiles.push(tile);
                }
            }, 1);
            //log.info("Initialized animated tiles.");
        },
    
        addToRenderingGrid: function(entity, x, y) {
            if(!this.map.isOutOfBounds(x, y)) {
                this.renderingGrid[y][x][entity.id] = entity;
            }
        },
    
        removeFromRenderingGrid: function(entity, x, y) {
            if(entity && this.renderingGrid[y][x] && entity.id in this.renderingGrid[y][x]) {
                delete this.renderingGrid[y][x][entity.id];
            }
        },
    
        removeFromEntityGrid: function(entity, x, y) {
            if(this.entityGrid[y][x][entity.id]) {
                delete this.entityGrid[y][x][entity.id];
            }
        },
        
        removeFromPathingGrid: function(x, y) {
            this.pathingGrid[y][x] = 0;
        },
    
        /**
         * Registers the entity at two adjacent positions on the grid at the same time.
         * This situation is temporary and should only occur when the entity is moving.
         * This is useful for the hit testing algorithm used when hovering entities with the mouse cursor.
         *
         * @param {Entity} entity The moving entity
         */
        registerEntityDualPosition: function(entity) {
            if(entity) {
                this.entityGrid[entity.gridY][entity.gridX][entity.id] = entity;
            
                this.addToRenderingGrid(entity, entity.gridX, entity.gridY);
            
                if(entity.nextGridX >= 0 && entity.nextGridY >= 0) {
                    this.entityGrid[entity.nextGridY][entity.nextGridX][entity.id] = entity;
                    if(!(entity instanceof Player)) {
                        this.pathingGrid[entity.nextGridY][entity.nextGridX] = 1;
                    }
                }
            }
        },
    
        /**
         * Clears the position(s) of this entity in the entity grid.
         *
         * @param {Entity} entity The moving entity
         */
        unregisterEntityPosition: function(entity) {
            if(entity) {
                this.removeFromEntityGrid(entity, entity.gridX, entity.gridY);
                this.removeFromPathingGrid(entity.gridX, entity.gridY);
            
                this.removeFromRenderingGrid(entity, entity.gridX, entity.gridY);
            
                if(entity.nextGridX >= 0 && entity.nextGridY >= 0) {
                    this.removeFromEntityGrid(entity, entity.nextGridX, entity.nextGridY);
                    this.removeFromPathingGrid(entity.nextGridX, entity.nextGridY);
                }
            }
        },
    
        registerEntityPosition: function(entity) {
            var x = entity.gridX,
                y = entity.gridY;
        
            if(entity) {
                if(entity instanceof Character) {
                    this.entityGrid[y][x][entity.id] = entity;
                    if(!(entity instanceof Player)) {
                        this.pathingGrid[y][x] = 1;
                    }
                }
                this.addToRenderingGrid(entity, x, y);
            }
        },

        initSpaceAreas: function() {
            this.spaceManager = new SpaceManager(this);
            _.each(this.map.spaceAreas, function(area) {
                this.spaceManager.addArea(area.x, area.y, area.w, area.h, area.id);
            }.bind(this));
        },

        run: function(credentials, started_callback) {
            var self = this;
        
            this.loadSprites();
            this.setUpdater(new Updater(this));
            this.camera = this.renderer.camera;
        
            this.setSpriteScale(this.renderer.scale);
        
            var wait = setInterval(function() {
                if(self.map.isLoaded && self.spritesLoaded()) {
                    self.ready = true;
                    log.debug('All sprites loaded.');
                            
                    self.initSpaceAreas();
                    self.initCursors();
                    self.initAnimations();
                    self.initShadows();
                
                    if(self.renderer.upscaledRendering) {
                        self.initSilhouettes();
                    }
            
                    self.initEntityGrid();
                    self.initPathingGrid();
                    self.initRenderingGrid();
                
                    self.setPathfinder(new Pathfinder(self.map.width, self.map.height));
            
                    self.initPlayer();
                    self.setCursor("hand");
                    
                    self.connect(credentials, started_callback);
                
                    clearInterval(wait);
                }
            }, 100);
        },
    
        tick: function() {
            this.currentTime = new Date().getTime();

            if(this.started) {
                this.updateCursorLogic();
                this.updater.update();
                this.renderer.renderFrame();
            }

            if(!this.isStopped) {
                requestAnimFrame(this.tick.bind(this));
            }
        },

        start: function() {
            this.tick();
            this.hasNeverStarted = false;
            log.info("Game loop started.");
        },

        stop: function() {
            log.info("Game stopped.");
            this.isStopped = true;
        },
    
        entityIdExists: function(id) {
            return id in this.entities;
        },

        getEntityById: function(id) {
            if(id in this.entities) {
                return this.entities[id];
            }
            else {
                log.error("Unknown entity id : " + id, true);
            }
        },

        connect: function(credentials, started_callback) {
            var self = this,
                connecting = false; // always in dispatcher mode in the build version
    
            // TODO: client instance
            this.client = new Client(config.host, config.clientId);

            this.client.onConnected(function(sessionId, displayName) {
                log.info("Starting client/server handshake");
                
                self.playerId = sessionId;
                self.player.id = sessionId;
                self.player.name = displayName;

                self.started = true;

                self.player.setGridPosition(50, 238); // TODO: put at the right place

                self.resetCamera();
                self.updatePlateauMode();
                self.spaceManager.updateSpace();

            
                self.addEntity(self.player);
                self.player.dirtyRect = self.renderer.getEntityBoundingRect(self.player);

                self.player.onStartPathing(function(path) {
                    var i = path.length - 1,
                        x =  path[i][0],
                        y =  path[i][1];
                
                    // Target cursor position
                    self.selectedX = x;
                    self.selectedY = y;
                    self.selectedCellVisible = true;
                });

                self.player.onBeforeStep(function() {
                    var blockingEntity = self.getEntityAt(self.player.nextGridX, self.player.nextGridY);
                    if(blockingEntity && blockingEntity.id !== self.playerId) {
                        log.debug("Blocked by " + blockingEntity.id);
                    }
                    self.unregisterEntityPosition(self.player);
                });
            
                self.player.onStep(function() {
                    if(self.player.hasNextStep()) {
                        self.registerEntityDualPosition(self.player);
                    }
                
                    if(self.isZoningTile(self.player.gridX, self.player.gridY)) {
                        self.enqueueZoningFrom(self.player.gridX, self.player.gridY);
                    }

                    self.spaceManager.updateSpace();
                });
            
                self.player.onStopPathing(function(x, y) {
                    if(self.player.hasTarget()) {
                        self.player.lookAtTarget();
                    }
                
                    self.selectedCellVisible = false;
                
                    if(!self.player.hasTarget() && self.map.isDoor(x, y)) {
                        var dest = self.map.getDoorDestination(x, y);
                    
                        self.player.setGridPosition(dest.x, dest.y);
                        self.player.nextGridX = dest.x;
                        self.player.nextGridY = dest.y;
                        self.player.turnTo(dest.orientation);
                        // TODO: join the right room
                        // self.client.join(spaceId);
                        
                        if(self.renderer.limitedViewport && dest.cameraX && dest.cameraY) {
                            self.camera.setGridPosition(dest.cameraX, dest.cameraY);
                            self.resetZone();
                        } else {
                            self.camera.focusEntity(self.player);
                            self.resetZone();
                        }
                        
                        self.updatePlateauMode();
                    }
                
                    if(self.player.target instanceof Npc) {
                        self.makeNpcTalk(self.player.target);
                    }                    
                    self.unregisterEntityPosition(self.player);
                    self.registerEntityPosition(self.player);
                });
            
                self.player.onRequestPath(function(x, y) {
                    var ignored = [self.player]; // Always ignore self
                
                    if(self.player.hasTarget()) {
                        ignored.push(self.player.target);
                    }
                    return self.findPath(self.player, x, y, ignored);
                });
            
                self.player.onHasMoved(function(player) {
                    self.assignBubbleTo(player);
                });
            
                self.client.onChatMessage(function(entityId, message) {
                    var entity = self.getEntityById(entityId);
                    self.createBubble(entityId, message);
                    self.assignBubbleTo(entity);
                });
            
                self.client.onDisconnected(function(message) {
                    if(self.disconnect_callback) {
                        self.disconnect_callback(message);
                    }
                });
            
                if(self.hasNeverStarted) {
                    self.start();
                    started_callback();
                }
            });
            this.client.connect(credentials);
        },

        /**
         * Converts the current mouse position on the screen to world grid coordinates.
         * @returns {Object} An object containing x and y properties.
         */
        getMouseGridPosition: function() {
            var mx = this.mouse.x,
                my = this.mouse.y,
                c = this.renderer.camera,
                s = this.renderer.scale,
                ts = this.renderer.tilesize,
                offsetX = mx % (ts * s),
                offsetY = my % (ts * s),
                x = ((mx - offsetX) / (ts * s)) + c.gridX,
                y = ((my - offsetY) / (ts * s)) + c.gridY;
        
                return { x: x, y: y };
        },
    
        /**
         * Moves a character to a given location on the world grid.
         *
         * @param {Number} x The x coordinate of the target location.
         * @param {Number} y The y coordinate of the target location.
         */
        makeCharacterGoTo: function(character, x, y) {
            if(!this.map.isOutOfBounds(x, y)) {
                character.go(x, y);
            }
        },
    
        /**
         * Moves the current player to a given target location.
         * @see makeCharacterGoTo
         */
        makePlayerGoTo: function(x, y) {
            this.makeCharacterGoTo(this.player, x, y);
        },
    
        /**
         *
         */
        makePlayerTalkTo: function(npc) {
            if(npc) {
                this.player.setTarget(npc);
                this.player.follow(npc);
            }
        },
    
        /**
         *
         */
        makeNpcTalk: function(npc) {
            var msg;
        
            if(npc) {
                msg = npc.talk();
                this.previousClickPosition = {};
                if(msg) {
                    this.createBubble(npc.id, msg);
                    this.assignBubbleTo(npc);
                } else {
                    this.destroyBubble(npc.id);
                }
            }
        },

        /**
         * Loops through all the entities currently present in the game.
         * @param {Function} callback The function to call back (must accept one entity argument).
         */
        forEachEntity: function(callback) {
            _.each(this.entities, function(entity) {
                callback(entity);
            });
        },
    
        /**
         * Loops through all entities visible by the camera and sorted by depth :
         * Lower 'y' value means higher depth.
         * Note: This is used by the Renderer to know in which order to render entities.
         */
        forEachVisibleEntityByDepth: function(callback) {
            var self = this,
                m = this.map;
        
            this.camera.forEachVisiblePosition(function(x, y) {
                if(!m.isOutOfBounds(x, y)) {
                    if(self.renderingGrid[y][x]) {
                        _.each(self.renderingGrid[y][x], function(entity) {
                            callback(entity);
                        });
                    }
                }
            }, this.renderer.limitedViewport ? 0 : 2);
        },
    
        /**
         * 
         */    
        forEachVisibleTileIndex: function(callback, extra) {
            var m = this.map;
        
            this.camera.forEachVisiblePosition(function(x, y) {
                if(!m.isOutOfBounds(x, y)) {
                    callback(m.GridPositionToTileIndex(x, y) - 1);
                }
            }, extra);
        },
    
        /**
         * 
         */
        forEachVisibleTile: function(callback, extra) {
            var self = this,
                m = this.map;
        
            if(m.isLoaded) {
                this.forEachVisibleTileIndex(function(tileIndex) {
                    if(_.isArray(m.data[tileIndex])) {
                        _.each(m.data[tileIndex], function(id) {
                            callback(id-1, tileIndex);
                        });
                    }
                    else {
                        if(_.isNaN(m.data[tileIndex]-1)) {
                            //throw Error("Tile number for index:"+tileIndex+" is NaN");
                        } else {
                            callback(m.data[tileIndex]-1, tileIndex);
                        }
                    }
                }, extra);
            }
        },
    
        /**
         * 
         */
        forEachAnimatedTile: function(callback) {
            if(this.animatedTiles) {
                _.each(this.animatedTiles, function(tile) {
                    callback(tile);
                });
            }
        },
    
        /**
         * Returns the entity located at the given position on the world grid.
         * @returns {Entity} the entity located at (x, y) or null if there is none.
         */
        getEntityAt: function(x, y) {
            if(this.map.isOutOfBounds(x, y) || !this.entityGrid) {
                return null;
            }
            
            var entities = this.entityGrid[y][x],
                entity = null;
            if(_.size(entities) > 0) {
                entity = entities[_.keys(entities)[0]];
            } 
            return entity;
        },

        getNpcAt: function(x, y) {
            var entity = this.getEntityAt(x, y);
            if(entity && (entity instanceof Npc)) {
                return entity;
            }
            return null;
        },
    
        /**
         * Returns true if an entity is located at the given position on the world grid.
         * @returns {Boolean} Whether an entity is at (x, y).
         */
        isEntityAt: function(x, y) {
            return !_.isNull(this.getEntityAt(x, y));
        },

        isNpcAt: function(x, y) {
            return !_.isNull(this.getNpcAt(x, y));
        },

        /**
         * Finds a path to a grid position for the specified character.
         * The path will pass through any entity present in the ignore list.
         */
        findPath: function(character, x, y, ignoreList) {
            var self = this,
                grid = this.pathingGrid;
                path = [],
                isPlayer = (character === this.player);
        
            if(this.map.isColliding(x, y)) {
                return path;
            }
        
            if(this.pathfinder && character) {
                if(ignoreList) {
                    _.each(ignoreList, function(entity) {
                        self.pathfinder.ignoreEntity(entity);
                    });
                }
            
                path = this.pathfinder.findPath(grid, character, x, y, false);
            
                if(ignoreList) {
                    this.pathfinder.clearIgnoreList();
                }
            } else {
                log.error("Error while finding the path to "+x+", "+y+" for "+character.id);
            }
            return path;
        },
    
        /**
         * Toggles the visibility of the pathing grid for debugging purposes.
         */
        togglePathingGrid: function() {
            if(this.debugPathing) {
                this.debugPathing = false;
            } else {
                this.debugPathing = true;
            }
        },
    
        /**
         * Toggles the visibility of the FPS counter and other debugging info.
         */
        toggleDebugInfo: function() {
            if(this.renderer && this.renderer.isDebugInfoVisible) {
                this.renderer.isDebugInfoVisible = false;
            } else {
                this.renderer.isDebugInfoVisible = true;
            }
        },
    
        /**
         * 
         */
        movecursor: function() {
            var mouse = this.getMouseGridPosition(),
                x = mouse.x,
                y = mouse.y;

            if(this.player) {
                this.hoveringCollidingTile = this.map.isColliding(x, y);
                this.hoveringPlateauTile = this.player.isOnPlateau ? !this.map.isPlateau(x, y) : this.map.isPlateau(x, y);
                this.hoveringNpc = this.isNpcAt(x, y);
        
                if(this.hoveringNpc) {
                    var entity = this.getEntityAt(x, y);
            
                    if(!entity.isHighlighted && this.renderer.supportsSilhouettes) {
                        if(this.lastHovered) {
                            this.lastHovered.setHighlight(false);
                        }
                        this.lastHovered = entity;
                        entity.setHighlight(true);
                    }
                }
                else if(this.lastHovered) {
                    this.lastHovered.setHighlight(false);
                    this.lastHovered = null;
                }
            }
        },
    
        /**
         * Processes game logic when the user triggers a click/touch event during the game.
         */
        click: function() {
            var pos = this.getMouseGridPosition(),
                entity;
            
            if(pos.x === this.previousClickPosition.x
            && pos.y === this.previousClickPosition.y) {
                return;
            } else {
                this.previousClickPosition = pos;
            }
            
            if(this.started
            && this.player
            && !this.isZoning()
            && !this.isZoningTile(this.player.nextGridX, this.player.nextGridY)
            && !this.hoveringCollidingTile
            && !this.hoveringPlateauTile) {
                entity = this.getEntityAt(pos.x, pos.y);
            
                if(entity instanceof Npc) {
                    if(this.player.isAdjacentNonDiagonal(entity) === false) {
                        this.makePlayerTalkTo(entity);
                    } else {
                        this.makeNpcTalk(entity);
                    }
                }
                else {
                    this.makePlayerGoTo(pos.x, pos.y);
                }
            }
        },
        
        getFreeAdjacentNonDiagonalPosition: function(entity) {
            var self = this,
                result = null;
            
            entity.forEachAdjacentNonDiagonalPosition(function(x, y, orientation) {
                if(!result && !self.map.isColliding(x, y) && !self.isMobAt(x, y)) {
                    result = {x: x, y: y, o: orientation};
                }
            });
            return result;
        },
        
        /**
         * 
         */
        isZoningTile: function(x, y) {
            var c = this.camera;
        
            x = x - c.gridX;
            y = y - c.gridY;
            
            if(x === 0 || y === 0 || x === c.gridW-1 || y === c.gridH-1) {
                return true;
            }
            return false;
        },
    
        /**
         * 
         */
        getZoningOrientation: function(x, y) {
            var orientation = "",
                c = this.camera;

            x = x - c.gridX;
            y = y - c.gridY;
       
            if(x === 0) {
                orientation = Types.Orientations.LEFT;
            }
            else if(y === 0) {
                orientation = Types.Orientations.UP;
            }
            else if(x === c.gridW-1) {
                orientation = Types.Orientations.RIGHT;
            }
            else if(y === c.gridH-1) {
                orientation = Types.Orientations.DOWN;
            }
        
            return orientation;
        },
    
        startZoningFrom: function(x, y) {
            this.zoningOrientation = this.getZoningOrientation(x, y);
        
            if(this.renderer.mobile || this.renderer.tablet) {
                var z = this.zoningOrientation,
                    c = this.camera,
                    ts = this.renderer.tilesize,
                    x = c.x,
                    y = c.y,
                    xoffset = (c.gridW - 2) * ts,
                    yoffset = (c.gridH - 2) * ts;
            
                if(z === Types.Orientations.LEFT || z === Types.Orientations.RIGHT) {
                    x = (z === Types.Orientations.LEFT) ? c.x - xoffset : c.x + xoffset;
                } else if(z === Types.Orientations.UP || z === Types.Orientations.DOWN) {
                    y = (z === Types.Orientations.UP) ? c.y - yoffset : c.y + yoffset;
                }
                c.setPosition(x, y);
            
                this.renderer.clearScreen(this.renderer.context);
                this.endZoning();
                
                // Force immediate drawing of all visible entities in the new zone
                this.forEachVisibleEntityByDepth(function(entity) {
                    entity.setDirty();
                });
            }
            else {
                this.currentZoning = new Transition();
            }
            this.bubbleManager.clean();
        },
        
        enqueueZoningFrom: function(x, y) {
            this.zoningQueue.push({x: x, y: y});
            
            if(this.zoningQueue.length === 1) {
                this.startZoningFrom(x, y);
            }
        },
    
        endZoning: function() {
            this.currentZoning = null;
            this.resetZone();
            this.zoningQueue.shift();
            
            if(this.zoningQueue.length > 0) {
                var pos = this.zoningQueue[0];
                this.startZoningFrom(pos.x, pos.y);
            }
        },
    
        isZoning: function() {
            return !_.isNull(this.currentZoning);
        },
    
        resetZone: function() {
            this.bubbleManager.clean();
            this.initAnimatedTiles();
            this.renderer.renderStaticCanvases();
        },
    
        resetCamera: function() {
            this.camera.focusEntity(this.player);
            this.resetZone();
        },
    
        say: function(message) {
            this.client.sendChat(message);
        },
    
        createBubble: function(id, message) {
            this.bubbleManager.create(id, message, this.currentTime);
        },
    
        destroyBubble: function(id) {
            this.bubbleManager.destroyBubble(id);
        },
    
        assignBubbleTo: function(character) {
            var bubble = this.bubbleManager.getBubbleById(character.id);
        
            if(bubble) {
                var s = this.renderer.scale,
                    t = 16 * s, // tile size
                    x = ((character.x - this.camera.x) * s),
                    w = parseInt(bubble.element.css('width')) + 24,
                    offset = (w / 2) - (t / 2),
                    offsetY,
                    y;
            
                if(character instanceof Npc) {
                    offsetY = 0;
                } else {
                    if(s === 2) {
                        if(this.renderer.limitedViewport) {
                            offsetY = 0;
                        } else {
                            offsetY = 15;
                        }
                    } else {
                        offsetY = 12;
                    }
                }
            
                y = ((character.y - this.camera.y) * s) - (t * 2) - offsetY;
            
                bubble.element.css('left', x - offset + 'px');
                bubble.element.css('top', y + 'px');
            }
        },
    
        onDisconnect: function(callback) {
            this.disconnect_callback = callback;
        },
    
        onNotification: function(callback) {
            this.notification_callback = callback;
        },
    
        resize: function() {
            var x = this.camera.x,
                y = this.camera.y,
                currentScale = this.renderer.scale,
                newScale = this.renderer.getScaleFactor();
    
                this.renderer.rescale(newScale);
                this.camera = this.renderer.camera;
                this.camera.setPosition(x, y);

                this.renderer.renderStaticCanvases();
        },
    
        showNotification: function(message) {
            if(this.notification_callback) {
                this.notification_callback(message);
            }
        },

        /**
         * Fake a mouse move event in order to update the cursor.
         *
         * For instance, to get rid of the sword cursor in case the mouse is still hovering over a dying mob.
         * Also useful when the mouse is hovering a tile where an item is appearing.
         */
        updateCursor: function() {
            this.movecursor();
            this.updateCursorLogic();
        },
    
        /**
         * Change player plateau mode when necessary
         */
        updatePlateauMode: function() {
            if(this.map.isPlateau(this.player.gridX, this.player.gridY)) {
                this.player.isOnPlateau = true;
            } else {
                this.player.isOnPlateau = false;
            }
        },

        forEachEntityAround: function(x, y, r, callback) {
            for(var i = x-r, max_i = x+r; i <= max_i; i += 1) {
                for(var j = y-r, max_j = y+r; j <= max_j; j += 1) {
                    if(!this.map.isOutOfBounds(i, j)) {
                        _.each(this.renderingGrid[j][i], function(entity) {
                            callback(entity);
                        });
                    }
                }
            }
        },
        
        checkOtherDirtyRects: function(r1, source, x, y) {
            var r = this.renderer;
            
            this.forEachEntityAround(x, y, 2, function(e2) {
                if(source && source.id && e2.id === source.id) {
                    return;
                }
                if(!e2.isDirty) {
                    var r2 = r.getEntityBoundingRect(e2);
                    if(r.isIntersecting(r1, r2)) {
                        e2.setDirty();
                    }
                }
            });
            
            if(source && !(source.hasOwnProperty("index"))) {
                this.forEachAnimatedTile(function(tile) {
                    if(!tile.isDirty) {
                        var r2 = r.getTileBoundingRect(tile);
                        if(r.isIntersecting(r1, r2)) {
                            tile.isDirty = true;
                        }
                    }
                });
            }
            
            if(!this.drawTarget && this.selectedCellVisible) {
                var targetRect = r.getTargetBoundingRect();
                if(r.isIntersecting(r1, targetRect)) {
                    this.drawTarget = true;
                    this.renderer.targetRect = targetRect;
                }
            }
        }
    });
    
    return Game;
});
