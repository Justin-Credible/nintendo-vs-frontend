
namespace JustinCredible.NintendoVsFrontend.Renderer.Controllers {

    /**
     * This is the base controller that all other controllers should utilize.
     * 
     * It handles saving a reference to the Angular scope, newing up the given
     * model object type, and injecting the view model and controller onto the
     * scope object for use in views.
     * 
     * V - The type of the view model that this controller will utilize.
     * D - The type of data object that will be passed in when this dialog is opened.
     * R - The type of the data object that will be returned when this dialog is closed.
     */
    export abstract class BaseDialogController<V, D, R> extends BaseController<V> {

        protected scope: ng.dialog.IDialogScope;

        // constructor(scope: ng.IScope, ViewModelType: { new (): V; }, dialogId: string) {
        constructor(scope: ng.IScope, ViewModelType: any) {
            super(scope, ViewModelType);

            this.scope.$on("ngDialog.opened", _.bind(this.internal_dialog_opened, this));
            this.scope.$on("ngDialog.closing", _.bind(this.internal_dialog_closing, this));
            this.scope.$on("ngDialog.closed", _.bind(this.internal_dialog_closed, this));
        }

        //#region Internal Event Handlers

        /**
         * Internal method to handle dialog opened broadcast events.
         */
        private internal_dialog_opened(event: ng.IAngularEvent, element: ng.IAugmentedJQuery) {

            // HACK: Use our insider knowledge of UiHelper to determine if this event is applicable to this dialog instance.

            /* tslint:disable:no-string-literal */
            let dialogId = this.getData()["__dialogIdCounter"];
            /* tslint:enable:no-string-literal */

            let className = "UiHelper_Dialog_" + dialogId;

            if (element.hasClass(className)) {
                this.dialog_opened(event, element);
            }
        }

        /**
         * Internal method to handle dialog closing broadcast events.
         */
        private internal_dialog_closing(event: ng.IAngularEvent, element: ng.IAugmentedJQuery) {

            // HACK: Use our insider knowledge of UiHelper to determine if this event is applicable to this dialog instance.

            /* tslint:disable:no-string-literal */
            let dialogId = this.getData()["__dialogIdCounter"];
            /* tslint:enable:no-string-literal */

            let className = "UiHelper_Dialog_" + dialogId;

            if (element.hasClass(className)) {
                this.dialog_closing(event, element);
            }
        }

        /**
         * Internal method to handle dialog closed broadcast events.
         */
        private internal_dialog_closed(event: ng.IAngularEvent, element: ng.IAugmentedJQuery) {

            // HACK: Use our insider knowledge of UiHelper to determine if this event is applicable to this dialog instance.

            /* tslint:disable:no-string-literal */
            let dialogId = this.getData()["__dialogIdCounter"];
            /* tslint:enable:no-string-literal */

            let className = "UiHelper_Dialog_" + dialogId;

            if (element.hasClass(className)) {
                this.dialog_closed(event, element);
            }
        }

        //#endregion

        //#region Protected Methods

        /**
         * Used to get the data object that this was opened with.
         */
        protected getData(): D {
            return <D>this.scope.ngDialogData;
        }

        /**
         * Used to close the dialog.
         */
        protected close(): void;

        /**
         * Used to close the dialog.
         * 
         * @param result The return result value for this dialog.
         */
        protected close(result: R): void;

        /**
         * Used to close the dialog.
         * 
         * @param result The return result value for this dialog.
         */
        protected close(result?: R): void {
            this.scope.closeThisDialog(result);
        }

        //#endregion

        //#region Abstract Methods

        /**
         * Fired when this dialog is opened.
         */
        protected abstract dialog_opened(event: ng.IAngularEvent, element: ng.IAugmentedJQuery): void;

        /**
         * Fired when this dialog is about to close.
         */
        protected abstract dialog_closing(event: ng.IAngularEvent, element: ng.IAugmentedJQuery): void;

        /**
         * Fired when this dialog has closed.
         */
        protected abstract dialog_closed(event: ng.IAngularEvent, element: ng.IAugmentedJQuery): void;

        //#endregion
    }
}
