
namespace JustinCredible.NintendoVsFrontend.Renderer.Services {

    /**
     * Helper methods for the user interface.
     */
    export class UIHelper {

        //#region Injection

        public static ID = "UIHelper";

        public static get $inject(): string[] {
            return [
                "$q",
                "$timeout",
                "ngDialog",
                "electronIpcRenderer",
                Utilities.ID,
                SFX.ID,
            ];
        }

        constructor(
            private $q: ng.IQService,
            private $timeout: ng.ITimeoutService,
            private ngDialog: angular.dialog.IDialogService,
            private ipcRenderer: GitHubElectron.IpcRenderer,
            private Utilities: Services.Utilities,
            private SFX: Services.SFX) {
        }

        //#endregion

        /**
         * Counter to keep track of each of the unique dialog instances.
         */
        private _dialogIdCounter: number = 0;

        public showToast(type: string, title: string, message: string): void {

            let dialogOptions: ng.dialog.IDialogOpenOptions = {
                template: null,
                overlay: false,
                className: "ngdialog-theme-nintendo-toast"
            };

            let controllerOptions = new Models.ToastDialogModel();
            controllerOptions.title = title;
            controllerOptions.message = message;
            controllerOptions.type = type;

            let instance = this.showAndGetDialogInstance(Controllers.ToastDialogController, controllerOptions, dialogOptions);

            this.$timeout(() => { instance.close(); }, 3000);
        }

        public showSystemNotification(type: string, title: string, message: string): void {
            this.ipcRenderer.send("renderer_showSystemNotification", type, title, message);
        }

        public showAndGetDialogInstance(DialogController: Function, data?: any, options?: ng.dialog.IDialogOpenOptions): angular.dialog.IDialogOpenResult {

            if (!this.Utilities.derivesFrom(DialogController, Controllers.BaseDialogController)) {
                throw new Error("The DialogController passed was not a class instance extending BaseDialogController.");
            }

            /* tslint:disable:no-string-literal */
            let templatePath = DialogController["TemplatePath"];
            /* tslint:enable:no-string-literal */

            if (typeof(templatePath) !== "string") {
                throw new Error("The DialogController passed did not have a string TemplatePath static property.");
            }

            this._dialogIdCounter += 1;

            // HACK: We need this variable populated so we can stuff the dialog ID counter in it.
            // This will lead to problems for dialogs that null check their data via this.getData().
            if (!data) {
                data = {};
            }

            // HACK: For identifying the dialog instance in BaseDialogController to filter broadcast events.
            data.__dialogIdCounter = this._dialogIdCounter;

            let openOptions: ng.dialog.IDialogOpenOptions = {
                template: templatePath,
                controller: DialogController,
                data: data,
                showClose: false,
                closeByEscape: false,
                closeByNavigation: false,
                closeByDocument: false,
                className: "ngdialog-theme-nintendo",
            };

            // Merge the user provided options into the defaults.
            _.extend(openOptions, options);

            // Template path can't be overridden.
            openOptions.template = templatePath;

            // HACK: For identifying the dialog instance in BaseDialogController to filter broadcast events.
            openOptions.className += " UiHelper_Dialog_" + this._dialogIdCounter;

            return this.ngDialog.open(openOptions);
        }

        public showDialog(DialogController: Function, data?: any, options?: ng.dialog.IDialogOpenOptions): ng.IPromise<any> {
            let q = this.$q.defer<any>();

            let instance = this.showAndGetDialogInstance(DialogController, data, options);

            instance.closePromise.then((result: ng.dialog.IDialogClosePromise) => {
                q.resolve(result.value);
            });

            return q.promise;
        }

        private _pleaseWaitDialog: angular.dialog.IDialogOpenResult;

        public showPleaseWait(): void {

            if (this._pleaseWaitDialog) {
                return;
            }

            this._pleaseWaitDialog = this.showAndGetDialogInstance(Controllers.PleaseWaitDialogController);
        }

        public hidePleaseWait(): void {

            if (this._pleaseWaitDialog) {
                this._pleaseWaitDialog.close();
                this._pleaseWaitDialog = null;
            }
        }
    }
}
