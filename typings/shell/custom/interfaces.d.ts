
declare namespace Interfaces {

    interface Dictionary<T> { [key: string]: T; }

    interface NumberDictionary<T> { [key: number]: T; }

    /**
     * Variables emitted at build time which contain useful application information.
     * Corresponds to the contents of the generated build-vars.json file.
     */
    interface BuildVars {

        /**
         * True if the application was build in debug configuration; false if it was
         * build a release or distribution configuration.
         */
        debug: boolean;

        /**
         * The time at which the application was built.
         */
        buildTimestamp: string;

        /**
         * The version of the application.
         */
        version: string;

        /**
         * The short SHA for the git commit that this build was created from.
         * 
         * Will be 'unknown' if the commit couldn't be determined or the machine
         * that made the build did not have git installed.
         */
        commitShortSha: string;
    }

    /**
     * Describes the display objects returned by:
     * electron.screen.getAllDisplays()
     */
    interface ElectronDisplay {
        id: number;
        bounds: {
            x: number;
            y: number;
            width: number;
            height: number
        };
        workArea: {
            x: number;
            y: number;
            width: number;
            height: number
        };
        size: {
            width: number;
            height: number
        };
        workAreaSize: {
            width: number;
            height: number
        };
        scaleFactor: number;
        rotation: number;
        touchSupport: string;
    }

    interface Config {
        borderlessgaming: BorderlessGamingConfig;
        displayFusion: DisplayFusionConfig;
        taskKill: string;
        mame: MameConfig;
        menu: MenuConfig;
        bindings: Bindings;
    }

    interface BorderlessGamingConfig {
        executable: string;
        delay: number;
    }

    interface DisplayFusionConfig {
        executable: string;
        cloneProfile: string;
        extendProfile: string;
    }

    interface MameConfig {
        executable: string;
        workingDir: string;
        args: string[];
        screens: {
            a: string;
            b: string;
        };
        mameAudioChannelSwitches: {
            a: string;
            b: string;
        };
        customConfigRoot: string;
    }

    interface MenuConfig {
        keyInputMinDelay: number;
        keyInputMaxDelay: number;
        originMonitorSide: string;
        realTimeAttractMode: boolean;
    }

    interface Bindings {
        player1: PlayerBindings;
        player2: PlayerBindings;
        player3: PlayerBindings;
        player4: PlayerBindings;
    }

    interface PlayerBindings {
        up: number;
        down: number;
        left: number;
        right: number;
        a: number;
        b: number;
        start: number;
        coin: number;
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
    }
}
