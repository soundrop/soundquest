define(['jquery', 'app', 'detect'], function($, App, Detect) {
    var app, game;
 
    var initApp = function() {
        $(document).ready(function() {
            app = new App();
        
            if(Detect.isWindows()) {
                // Workaround for graphical glitches on text
                $('body').addClass('windows');
            }
            
            $('body').click(function(event) {
                if($('#parchment').hasClass('about')) {
                    app.toggleAbout();
                }
            });
    
            $('.barbutton').click(function() {
                $(this).toggleClass('active');
            });
    
            $('#chatbutton').click(function() {
                if($('#chatbutton').hasClass('active')) {
                    app.showChat();
                } else {
                    app.hideChat();
                }
            });
    
            $('#helpbutton').click(function() {
                app.toggleAbout();
            });
    
            $('#instructions').click(function() {
                app.hideWindows();
            });
            
            $('.clickable').click(function(event) {
                event.stopPropagation();
            });
    
            $('#notifications div').bind(TRANSITIONEND, app.resetMessagesPosition.bind(app));
    
            $('.close').click(function() {
                app.hideWindows();
            });
        
            $('.twitter').click(function() {
                var url = $(this).attr('href');

               app.openPopup('twitter', url);
               return false;
            });

            $('.facebook').click(function() {
                var url = $(this).attr('href');

               app.openPopup('facebook', url);
               return false;
            });
        
            $('.play div').click(function(event) {
                app.tryStartingGame();
            });
        
            $('#resize-check').bind("transitionend", app.resizeUi.bind(app));
            $('#resize-check').bind("webkitTransitionEnd", app.resizeUi.bind(app));
            $('#resize-check').bind("oTransitionEnd", app.resizeUi.bind(app));
        
            log.info("App initialized.");
        
            initGame();
        });
    };
    
    var initGame = function() {
        require(['game'], function(Game) {
            var canvas = document.getElementById("entities"),
                background = document.getElementById("background"),
                foreground = document.getElementById("foreground"),
                input = document.getElementById("chatinput");

            game = new Game(app);
            game.setup('#bubbles', canvas, background, foreground, input);
            game.setStorage(app.storage);
            app.setGame(game);
            
            game.loadMap();
    
            game.onDisconnect(function(message) {
                $('#death').find('p').html(message+"<em>Please reload the page.</em>");
            });

            game.onNotification(function(message) {
                app.showMessage(message);
            });
    
            $('#chatbox').attr('value', '');
            $('#foreground').click(function(event) {
                app.setMouseCoordinates(event);
                if(game) {
                    game.click();
                }
                app.hideWindows();
                // $('#chatinput').focus();
            });

            $('body').unbind('click');
            $('body').click(function(event) {
                var hasClosedParchment = false;
                
                if($('#parchment').hasClass('about')) {
                    if(game.started) {
                        app.closeInGameAbout();
                        hasClosedParchment = true;
                    } else {
                        app.toggleAbout();
                    }
                }
                
                if(game.started && game.player && !hasClosedParchment) {
                    game.click();
                }
            });
            
            $(document).mousemove(function(event) {
                app.setMouseCoordinates(event);
                if(game.started) {
                    game.movecursor();
                }
            });

            $(document).keydown(function(e) {
                var key = e.which,
                    $chat = $('#chatinput');

                if(key === 13) {
                    if($('#chatbox').hasClass('active')) {
                        app.hideChat();
                    } else {
                        app.showChat();
                    }
                }
            });
            
            $('#chatinput').keydown(function(e) {
                var key = e.which,
                    $chat = $('#chatinput');

                if(key === 13) {
                    if($chat.attr('value') !== '') {
                        if(game.player) {
                            game.say($chat.attr('value'));
                        }
                        $chat.attr('value', '');
                        app.hideChat();
                        $('#foreground').focus();
                        return false;
                    } else {
                        app.hideChat();
                        return false;
                    }
                }
                
                if(key === 27) {
                    app.hideChat();
                    return false;
                }
            });

            $(document).bind("keydown", function(e) {
                var key = e.which,
                    $chat = $('#chatinput');

                if($('#chatinput:focus').size() == 0 && $('#nameinput:focus').size() == 0) {
                    if(key === 13) { // Enter
                        if(game.ready) {
                            $chat.focus();
                            return false;
                        }
                    }
                    if(key === 32) { // Space
                        // game.togglePathingGrid();
                        return false;
                    }
                    if(key === 70) { // F
                        // game.toggleDebugInfo();
                        return false;
                    }
                    if(key === 27) { // ESC
                        app.hideWindows();
                        _.each(game.player.attackers, function(attacker) {
                            attacker.stop();
                        });
                        return false;
                    }
                    if(key === 65) { // a
                        // game.player.hit();
                        return false;
                    }
                } else {
                    if(key === 13 && game.ready) {
                        $chat.focus();
                        return false;
                    }
                }
            });
        });
    };
    
    initApp();
});
