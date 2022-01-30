
namespace JustinCredible.NintendoVsFrontend.Renderer.Services {

    /**
     * Service for sound effects
     */
    export class SFX {

        //#region Injection

        public static ID = "SFX";

        public static get $inject(): string[] {
            return [];
        }

        constructor() {
            /* tslint:disable:no-empty */
            /* tslint:enable:no-empty */
        }

        private _audioInstances: Interfaces.Dictionary<HTMLAudioElement> = {};

        //#endregion

        //#region Common Methods

        public getAudioInstance(href: string): HTMLAudioElement {

            if (this._audioInstances[href]) {
                return this._audioInstances[href];
            }

            var instance = new Audio(href);
            instance.loop = false;
            instance.autoplay = false;
            instance.volume = 0.25;

            this._audioInstances[href] = instance;

            return instance;
        }

        public playAudio(href: string): void;

        public playAudio(instance: HTMLAudioElement): void;

        public playAudio(instanceOrHref: any): void {

            if (!instanceOrHref) {
                return;
            }

            let instance: HTMLAudioElement;

            if (typeof(instanceOrHref) === "string") {
                instance = this.getAudioInstance(instanceOrHref);
            }

            if (typeof(instanceOrHref) === "object") {
                instance = instance;
            }

            if (!instance) {
                return;
            }

            if (!instance.paused) {
                instance.pause();
                instance.currentTime = 0;
            }

            instance.play();
        }

        //#endregion

        //#region Specific SFX Helpers

        public playCursorMove(): void {
            this.playAudio("sfx/ff7-cursor.wav");
        }

        public playReady(): void {
            this.playAudio("sfx/ff7-ready.wav");
        }

        public playCancel(): void {
            this.playAudio("sfx/ff7-cancel.wav");
        }

        public playError(): void {
            this.playAudio("sfx/ff7-error.wav");
        }

        public playOk(): void {
            this.playAudio("sfx/ff7-ok.wav");
        }

        //#endregion
    }
}
