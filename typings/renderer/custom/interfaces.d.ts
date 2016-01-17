
declare namespace JustinCredible.NintendoVsFrontend.Renderer.Interfaces {

    /**
     * Variables emitted at build time which contain useful application information.
     * Corresponds to the contents of the generated build-vars.json file.
     */
    interface BuildVars {

        /**
         * True if the application was build in debug configuration, false if it was
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
}
