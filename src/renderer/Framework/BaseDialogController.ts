
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

            this.scope.$on("ngDialog.opened", _.bind(this.dialog_opened, this));
            this.scope.$on("ngDialog.closing", _.bind(this.dialog_closing, this));
            this.scope.$on("ngDialog.closed", _.bind(this.dialog_closed, this));
        }

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
            this.scope["confirm"](result);
        }

        protected cancel(): void {
            this.scope.closeThisDialog();
        }

        //#endregion

        //#region Events

        /**
         * Fired when this dialog is opened.
         */
        protected abstract dialog_opened();

        /**
         * Fired when this dialog is about to close.
         */
        protected abstract dialog_closing();

        /**
         * Fired when this dialog has closed.
         */
        protected abstract dialog_closed();

        //#endregion
    }
}
