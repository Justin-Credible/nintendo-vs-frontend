
declare namespace CustomTypes {

    /**
    * Describes the contents of the build-vars.json file.
    */
    interface BuildVars {
        commitShortSha: string;
        debug: boolean;
        buildTimestamp: string;
    }

    /**
     * Describes the display objects returned by:
     * electron.screen.getAllDisplays()
     */
    interface ElectronDisplay {
        id: number,
        bounds: {
            x: number,
            y: number,
            width: number,
            height: number
        },
        workArea: {
            x: number,
            y: number,
            width: number,
            height: number
        },
        size: {
            width: number,
            height: number
        },
        workAreaSize: {
            width: number,
            height: number
        },
        scaleFactor: number,
        rotation: number,
        touchSupport: string
    }

    /**
     * Describes the root level game nodes from game-list.yml.
     */
    interface GameDescriptor {
        name: string;
        platform: string;
        resource: string;
        specs: GameSpecification[];
    }

    /**
     * Describes a specification for a game.
     */
    interface GameSpecification {
        type: string;
        players: string;
        resource: string;
        config: string;
    }
}
