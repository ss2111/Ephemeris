/**
 * Module defining the action handler
 * @module app/action
 */
define(['app/config', 'app/network', 'app/player', 'app/utils', 'app/ship'],
function(config, network, player, utils, Ship){
    "use strict"

    /**
     * An event handler, which records and performs requested actions
     * @alias module:app/action
     */
    var ActionHandler = function(){}

    /**
     * Initialize the action handler
     *
     * @param {Phaser.Game} game - A reference to the current game object
     */
    ActionHandler.prototype.init = function(game) {
        this.game = game;
        this.actions = [];
        return this;
    }

    /**
     * Function which dispatches an action to the appropriate handler
     *
     * @param {object} action - An action to perform
     */
    ActionHandler.prototype.do = function(action) {
        // Clone the action, as acting on it, may destroy it
        var clone = utils.clone(action);

        this.actions.push(clone);

        switch(action.type.toLowerCase()) {
        case "attack":
            this.game.getUnit(action.data.source).attack(
                this.game.getUnit(action.data.target)
            );
            break;
        case "move":
            this.game.getUnit(action.data.id).moveTo(action.data.path);
            break;
        case "engage":
            this.game.getUnit(action.data.source).moveTo(action.data.target);
            break;
        case "create":
            var type = null;
            switch(action.data.type.toLowerCase()){
            case "ship":
                type = Ship;
                break;
            default:
                console.error("Unknown unit type:", action.data.type);
            }
            var newUnit = new type(this.game,
                                   this,
                                   action.data.x,
                                   action.data.y,
                                   action.data.config);
            clone.data.config = clone.data.config || {};
            clone.data.config.id = newUnit.id;
            if (!clone.source){
                clone.data.config.playerID = player.id;
            }
            break;
        default:
            break;
        }

        if (!clone.source) {
            network.sendAction(clone);
        }
        return this;
    }

    var handler = new ActionHandler();
    return handler;
});
