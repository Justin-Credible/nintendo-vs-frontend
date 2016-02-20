namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    /**
     * This is the base controller that all other controllers should utilize.
     * 
     * It handles saving a reference to the Angular scope, newing up the given
     * model object type, and injecting the view model and controller onto the
     * scope object for use in views.
     * 
     * T - The parameter type for the model.
     */
    export class BaseController<T> {
        public scope: ng.IScope;
        public viewModel: T;

        constructor(scope: ng.IScope, ModelType: { new (): T; }) {

            // Uncomment for debugging view events.
            //console.log("ctor()  " + this.constructor["ID"]);

            // Save a reference to Angular's scope object.
            this.scope = scope;

            // Create the view model.
            this.viewModel = new ModelType();

            /* tslint:disable:no-string-literal */

            // Push the view model onto the scope so it can be
            // referenced from the template/views.
            this.scope["viewModel"] = this.viewModel;

            // Push the controller onto the scope so it can be
            // used to reference events for controls etc.
            this.scope["controller"] = this;

            /* tslint:enable:no-string-literal */

            _.defer(() => {
                this.view_loaded();
            });
        }

        /**
         * Invoked when the controller has been bound to a template.
         * 
         * Can be overridden by implementing controllers.
         */
        protected view_loaded(): void {
            /* tslint:disable:no-empty */
            /* tslint:enable:no-empty */
        }
    }
}
