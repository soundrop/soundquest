define(['jquery', 'storage'], function($, Storage) {

    var App = Class.extend({
        init: function() {
            this.previousState = null;
            this.isParchmentReady = true;
            this.ready = false;
            this.storage = new Storage();
            this.$playButton = $('.play'),
            this.$playDiv = $('.play div');
        },
        
        setGame: function(game) {
            this.game = game;
            this.ready = true;
        },
    
        canStartGame: function() {
            return (this.game && this.game.map && this.game.map.isLoaded);
        },
        
        tryStartingGame: function(username, starting_callback) {
            var self = this,
                $play = this.$playButton;
            
            if(username !== '') {
                if(!this.ready || !this.canStartGame()) {
                    $play.addClass('loading');
                    this.$playDiv.unbind('click');
                    var watchCanStart = setInterval(function() {
                        log.debug("waiting...");
                        if(self.canStartGame()) {
                            setTimeout(function() {
                                $play.removeClass('loading');
                            }, 1500);
                            clearInterval(watchCanStart);
                            self.startGame(username, starting_callback);
                        }
                    }, 100);
                } else {
                    this.$playDiv.unbind('click');
                    this.startGame(username, starting_callback);
                }      
            }
        },
        
        startGame: function(username, starting_callback) {
            var self = this;
            
            if(starting_callback) {
                starting_callback();
            }
            this.hideIntro(function() {
                self.start(username);
            });
        },

        start: function(username) {
            var self = this,
                firstTimePlaying = !self.storage.hasAlreadyPlayed();
            
            if(username && !this.game.started) {
                var config = this.config;

                this.game.setServerOptions(config.host, config.port, username);
                this.game.run(function() {
                    $('body').addClass('started');
                    if(firstTimePlaying) {
                        self.toggleInstructions();
                    }
                });
            }
        },

        setMouseCoordinates: function(event) {
            var gamePos = $('#container').offset(),
                scale = this.game.renderer.getScaleFactor(),
                width = this.game.renderer.getWidth(),
                height = this.game.renderer.getHeight(),
                mouse = this.game.mouse;

            mouse.x = event.pageX - gamePos.left - (this.isMobile ? 0 : 5 * scale);
            mouse.y = event.pageY - gamePos.top - (this.isMobile ? 0 : 7 * scale);

            if(mouse.x <= 0) {
                mouse.x = 0;
            } else if(mouse.x >= width) {
                mouse.x = width - 1;
            }

            if(mouse.y <= 0) {
                mouse.y = 0;
            } else if(mouse.y >= height) {
                mouse.y = height - 1;
            }
        },

        hideIntro: function(hidden_callback) {
            clearInterval(this.watchNameInputInterval);
            $('body').removeClass('intro');
            setTimeout(function() {
                $('body').addClass('game');
                hidden_callback();
            }, 1000);
        },

        showChat: function() {
            if(this.game.started) {
                $('#chatbox').addClass('active');
                $('#chatinput').focus();
                $('#chatbutton').addClass('active');
            }
        },

        hideChat: function() {
            if(this.game.started) {
                $('#chatbox').removeClass('active');
                $('#chatinput').blur();
                $('#chatbutton').removeClass('active');
            }
        },

        toggleInstructions: function() {
            $('#instructions').toggleClass('active');
        },

        hideWindows: function() {
            if($('#instructions').hasClass('active')) {
                this.toggleInstructions();
                $('#helpbutton').removeClass('active');
            }
            if($('body').hasClass('about')) {
                this.closeInGameAbout();
            }
        },
        
        toggleAbout: function() {
            // TODO: review
            var currentState = $('#parchment').attr('class');

            if(this.game.started) {
                $('#parchment').removeClass().addClass('about');
                $('body').toggleClass('about');
            } else {
                if(currentState !== 'animate') {
                    if(currentState === 'about') {
                        if(localStorage && localStorage.data) {
                            this.animateParchment(currentState, 'loadcharacter');
                        } else {
                            this.animateParchment(currentState, 'createcharacter');
                        }
                    } else {
                        this.animateParchment(currentState, 'about');
                        this.previousState = currentState;
                    }
                }
            }
        },

        closeInGameAbout: function() {
            $('body').removeClass('about');
            $('#parchment').removeClass('about');
            if(!this.game.player) {
                $('body').addClass('death');
            }
            $('#helpbutton').removeClass('active');
        },
        
        openPopup: function(type, url) {
            // TODO: port to spotify
            var h = $(window).height(),
                w = $(window).width(),
                popupHeight,
                popupWidth,
                top,
                left;

            switch(type) {
                case 'twitter':
                    popupHeight = 450;
                    popupWidth = 550;
                    break;
                case 'facebook':
                    popupHeight = 400;
                    popupWidth = 580;
                    break;
            }

            top = (h / 2) - (popupHeight / 2);
            left = (w / 2) - (popupWidth / 2);

            newwindow = window.open(url,'name','height=' + popupHeight + ',width=' + popupWidth + ',top=' + top + ',left=' + left);
            if (window.focus) {newwindow.focus()}
        },

        animateParchment: function(origin, destination) {
            var self = this,
                $parchment = $('#parchment'),
                duration = 1;

            if(this.isMobile) {
                $parchment.removeClass(origin).addClass(destination);
            } else {
                if(this.isParchmentReady) {
                    if(this.isTablet) {
                        duration = 0;
                    }
                    this.isParchmentReady = !this.isParchmentReady;
        
                    $parchment.toggleClass('animate');
                    $parchment.removeClass(origin);

                    setTimeout(function() {
                        $('#parchment').toggleClass('animate');
                        $parchment.addClass(destination);
                    }, duration * 1000);
        
                    setTimeout(function() {
                        self.isParchmentReady = !self.isParchmentReady;
                    }, duration * 1000);
                }
            }
        },

        animateMessages: function() {
            var $messages = $('#notifications div');

            $messages.addClass('top');
        },

        resetMessagesPosition: function() {
            var message = $('#message2').text();

            $('#notifications div').removeClass('top');
            $('#message2').text('');
            $('#message1').text(message);
        },

        showMessage: function(message) {
            var $wrapper = $('#notifications div'),
                $message = $('#notifications #message2');

            this.animateMessages();
            $message.text(message);
            if(this.messageTimer) {
                this.resetMessageTimer();
            }

            this.messageTimer = setTimeout(function() {
                    $wrapper.addClass('top');
            }, 5000);
        },

        resetMessageTimer: function() {
            clearTimeout(this.messageTimer);
        },
        
        resizeUi: function() {
            if(this.game) {
                if(this.game.started) {
                    this.game.resize();
                } else {
                    var newScale = this.game.renderer.getScaleFactor();
                    this.game.renderer.rescale(newScale);
                }
            } 
        }
    });

    return App;
});
