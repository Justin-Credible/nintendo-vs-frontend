
namespace JustinCredible.NintendoVsFrontend.Renderer.Boot2 {

    //#region Variables

    /**
     * The root Angular application module.
     */
    var ngModule: ng.IModule;

    /**
     * Holds the instance of the Application class.
     */
    var applicationInstance: Application;

    /**
     * Electron's remote API.
     */
    var remote = require("electron").remote;

    //#endregion

    export function boot(): void {

        // Define the top level Angular module for the application.
        // Here we also specify the Angular modules this module depends upon.
        ngModule = angular.module("JustinCredible.NintendoVsFrontend.Renderer.Application", ["templates"]);

        // Define our constants.
        ngModule.constant("buildVars", remote.getGlobal("buildVars"));
        ngModule.constant("gameList", remote.getGlobal("gameList"));
        ngModule.constant("electronRemote", require("electron").remote);
        ngModule.constant("electronIpcRenderer", require("electron").ipcRenderer);

        // Register the services, directives, filters, and controllers with Angular.
        BootHelper.registerServices(ngModule);
        // BootHelper.registerDirectives(ngModule);
        // BootHelper.registerFilters(ngModule);
        BootHelper.registerControllers(ngModule);

        // Register the application service manually since it lives outside of the services namespace.
        ngModule.service(Application.ID, Application);

        // Define the injection parameters for the initialize method.
        var $inject_angular_initialize: any[] = [
            Application.ID,

            // The method we are annotating.
            angular_initialize
        ];

        // Define the injection parameters for the configure method.
        var $inject_angular_configure: any[] = [
            "$provide",

            // The method we are annotating.
            angular_configure
        ];

        // Specify the initialize/run and configuration functions.
        ngModule.run($inject_angular_initialize);
        ngModule.config($inject_angular_configure);
    }

    //#region Platform Configuration

    /**
     * The main initialize/run function for Angular; fired once the AngularJs framework
     * is done loading.
     * 
     * The parameters to this method are automatically determined by Angular's
     * dependency injection based on the name of each parameter.
     */
    function angular_initialize(
        Application: Application
        ): void {

        // Once the document is ready we'll initialize the application.
        angular.element(document).ready(() => {
            applicationInstance = Application;
            Application.setAngularModule(ngModule);
            Application.start();
        });
    };

    /**
     * Function that is used to configure AngularJs.
     * 
     * The parameters to this method are automatically determined by Angular's
     * dependency injection based on the name of each parameter.
     */
    function angular_configure(
        $provide: ng.auto.IProvideService
        ): void {

        // Intercept the default Angular exception handler.
        $provide.decorator("$exceptionHandler", ["$delegate", function ($delegate: ng.IExceptionHandlerService) {
            return function (exception, cause) {

                // Delegate to our custom handler.
                if (applicationInstance) {
                    applicationInstance.angular_exceptionHandler(exception, cause);
                }

                // Delegate to the default/base Angular behavior.
                $delegate(exception, cause);
            };
        }]);

        // Setup all of the client side routes and their controllers and views.
        //RouteConfig.setupRoutes($stateProvider, $urlRouterProvider);
    };

    //#endregion
}
