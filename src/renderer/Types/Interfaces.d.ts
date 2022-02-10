
declare namespace JustinCredible.NintendoVsFrontend.Renderer.Interfaces {

    /**
     * Describes a dictionary of string to type-T (POJO, associative array).
     */
    interface Dictionary<T> {
        [index: string]: T;
    }

    /**
     * Represents input for a player.
     */
    interface PlayerInput {
        player: number;
        input: number;
    }

    /**
     * Describes the root level game nodes from game-list.yml.
     */
    interface GameDescriptor {
        name: string;
        platform: string;
        resource: string;
        specs: GameSpecification[];
        videoPath: string;
    }

    /**
     * Describes a specification for a game.
     */
    interface GameSpecification {
        type: string;
        players: string;
        resource: string;
        layout: string;
    }

    interface GameDescSpecPair {
        descriptor: GameDescriptor;
        specification: GameSpecification;
    }

    /**
     * Configuration specific to the menu.
     */
    interface MenuConfig {
        keyInputMinDelay: number;
        keyInputMaxDelay: number;
        originMonitorSide: string;
        realTimeAttractMode: boolean;
        autoStart: AutoStartConfig;
    }

    /**
     * Configuration for auto-starting games when the menu loads.
     */
    interface AutoStartConfig {
        sideAGameName: string;
        sideASpecIndex: number;
        sideBGameName: string;
        sideBSpecIndex: number;
    }
}
