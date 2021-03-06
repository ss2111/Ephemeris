/**
 * A module which handles networking
 * @module app/network
 */
define(["app/config", "socketio", "app/player", "app/utils"],
function(config, io, player, utils){
    "use strict"

    /**
     * Type which abstracts network communication
     * @alias module:app/network
     */
    var Network = function() {}

    /**
     * Connect the underlying web socket and execute 'callback' when complete
     *
     * @param {function} callback - Callback to be executed when the network
     *                              connection is established
     */
    Network.prototype.connect = function(connected, started) {
        var gameID = document.URL.match(/id=(.*)$/)[1];

        /**
         * The underlying socket object
         */
        this.socket = io(location.host, {
            query : "gameID=" + gameID
        });

        this.socket.on("connected", function(msg){
            if (!msg.player) {
                player.init(this.socket.id, msg.playerNumber)
            } else {
                player.clone(msg.player);
            }

            config.mapFormat = msg.map;
            config.mapName = msg.mapName;

            var game = connected();
            game.state.afterCreate = function(){
                game.loaded = true;
            }
            this.socket.on("joined", function(msg){
                msg.players.map(function(playerConfig) {
                    if (playerConfig.id != player.id)
                        player.registerOpponent(playerConfig.id,
                                                playerConfig.number);
                });

                if (!game.loaded) {
                    game.state.afterCreate = function(){
                        started && started(game);
                    }
                } else {
                    started && started(game);
                }
            })

            this.socket.on("ready", function(){
                this.onAllReady && this.onAllReady(msg.replay);
            }.bind(this));
        }.bind(this));
    }

    /**
     * Initialize the network communication
     *
     * @param {Phaser.Game} game - A reference to the current game object
     * @param {ActionHandler} handler - A reference the game action handler
     */
    Network.prototype.init = function(game, handler) {
        this.game = game;
        this.handler = handler;

        this.socket.on("action", function(action){
            this.handler.do(action);
        }.bind(this));

        this.socket.on("disconnected", function(msg){
            $("#game-over h1").html("Victory");
            $("#game-over").removeClass("hidden");
            this.game.running = false;
        }.bind(this));
        return this;
    }

    Network.prototype.ready = function() {
        this.socket.emit("ready", {});
    }

    /**
     * Send an action to the server
     *
     * @param {object} action - The action to send
     */
    Network.prototype.sendAction = function(action) {
        action.source = player.id;
        this.socket.emit("action", action);
        return this;
    }

    var network = new Network();

    return network;
});
