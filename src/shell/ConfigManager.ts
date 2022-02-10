
import * as fs from "fs";
import * as yaml from "js-yaml";
import * as Enums from "./Enums";

export var gameList: Interfaces.GameDescriptor[];
export var config: Interfaces.Config;

export var bindingTable: Interfaces.NumberDictionary<Interfaces.PlayerInput>;
export var bindingSideTable: Interfaces.NumberDictionary<string>;

export function loadConfigs(): void {
    gameList = yaml.safeLoad(fs.readFileSync(__dirname + "/../game-list.yml", "utf8"));
    config = yaml.safeLoad(fs.readFileSync(__dirname + "/../config.yml", "utf8"));

    bindingTable = getBindingTable(config);
    bindingSideTable = getBindingSideTable(config);
}

function getBindingTable(config: Interfaces.Config): Interfaces.NumberDictionary<Interfaces.PlayerInput> {

    var table: Interfaces.NumberDictionary<Interfaces.PlayerInput> = {};

    table[config.bindings.player1.up] = { player: Enums.Player.One, input: Enums.Input.Up };
    table[config.bindings.player1.down] = { player: Enums.Player.One, input: Enums.Input.Down };
    table[config.bindings.player1.left] = { player: Enums.Player.One, input: Enums.Input.Left };
    table[config.bindings.player1.right] = { player: Enums.Player.One, input: Enums.Input.Right };
    table[config.bindings.player1.a] = { player: Enums.Player.One, input: Enums.Input.OK };
    table[config.bindings.player1.b] = { player: Enums.Player.One, input: Enums.Input.Back };
    table[config.bindings.player1.start] = { player: Enums.Player.One, input: Enums.Input.Start };
    table[config.bindings.player1.coin] = { player: Enums.Player.One, input: Enums.Input.Select };

    table[config.bindings.player2.up] = { player: Enums.Player.Two, input: Enums.Input.Up };
    table[config.bindings.player2.down] = { player: Enums.Player.Two, input: Enums.Input.Down };
    table[config.bindings.player2.left] = { player: Enums.Player.Two, input: Enums.Input.Left };
    table[config.bindings.player2.right] = { player: Enums.Player.Two, input: Enums.Input.Right };
    table[config.bindings.player2.a] = { player: Enums.Player.Two, input: Enums.Input.OK };
    table[config.bindings.player2.b] = { player: Enums.Player.Two, input: Enums.Input.Back };
    table[config.bindings.player2.start] = { player: Enums.Player.Two, input: Enums.Input.Start };
    table[config.bindings.player2.coin] = { player: Enums.Player.Two, input: Enums.Input.Select };

    table[config.bindings.player3.up] = { player: Enums.Player.One, input: Enums.Input.Up };
    table[config.bindings.player3.down] = { player: Enums.Player.One, input: Enums.Input.Down };
    table[config.bindings.player3.left] = { player: Enums.Player.One, input: Enums.Input.Left };
    table[config.bindings.player3.right] = { player: Enums.Player.One, input: Enums.Input.Right };
    table[config.bindings.player3.a] = { player: Enums.Player.One, input: Enums.Input.OK };
    table[config.bindings.player3.b] = { player: Enums.Player.One, input: Enums.Input.Back };
    table[config.bindings.player3.start] = { player: Enums.Player.One, input: Enums.Input.Start };
    table[config.bindings.player3.coin] = { player: Enums.Player.One, input: Enums.Input.Select };

    table[config.bindings.player4.up] = { player: Enums.Player.Two, input: Enums.Input.Up };
    table[config.bindings.player4.down] = { player: Enums.Player.Two, input: Enums.Input.Down };
    table[config.bindings.player4.left] = { player: Enums.Player.Two, input: Enums.Input.Left };
    table[config.bindings.player4.right] = { player: Enums.Player.Two, input: Enums.Input.Right };
    table[config.bindings.player4.a] = { player: Enums.Player.Two, input: Enums.Input.OK };
    table[config.bindings.player4.b] = { player: Enums.Player.Two, input: Enums.Input.Back };
    table[config.bindings.player4.start] = { player: Enums.Player.Two, input: Enums.Input.Start };
    table[config.bindings.player4.coin] = { player: Enums.Player.Two, input: Enums.Input.Select };

    return table;
}

function getBindingSideTable(config: Interfaces.Config): Interfaces.NumberDictionary<string> {

    var table: Interfaces.NumberDictionary<string> = {};

    table[config.bindings.player1.up] = "A";
    table[config.bindings.player1.down] = "A";
    table[config.bindings.player1.left] = "A";
    table[config.bindings.player1.right] = "A";
    table[config.bindings.player1.a] = "A";
    table[config.bindings.player1.b] = "A";
    table[config.bindings.player1.start] = "A";
    table[config.bindings.player1.coin] = "A";
    table[config.bindings.player2.up] = "A";
    table[config.bindings.player2.down] = "A";
    table[config.bindings.player2.left] = "A";
    table[config.bindings.player2.right] = "A";
    table[config.bindings.player2.a] = "A";
    table[config.bindings.player2.b] = "A";
    table[config.bindings.player2.start] = "A";
    table[config.bindings.player2.coin] = "A";

    table[config.bindings.player3.up] = "B";
    table[config.bindings.player3.down] = "B";
    table[config.bindings.player3.left] = "B";
    table[config.bindings.player3.right] = "B";
    table[config.bindings.player3.a] = "B";
    table[config.bindings.player3.b] = "B";
    table[config.bindings.player3.start] = "B";
    table[config.bindings.player3.coin] = "B";
    table[config.bindings.player4.up] = "B";
    table[config.bindings.player4.down] = "B";
    table[config.bindings.player4.left] = "B";
    table[config.bindings.player4.right] = "B";
    table[config.bindings.player4.a] = "B";
    table[config.bindings.player4.b] = "B";
    table[config.bindings.player4.start] = "B";
    table[config.bindings.player4.coin] = "B";

    return table;
}
