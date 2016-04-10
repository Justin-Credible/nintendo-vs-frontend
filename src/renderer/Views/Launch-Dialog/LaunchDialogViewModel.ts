
namespace JustinCredible.NintendoVsFrontend.Renderer.ViewModels {

    export class LaunchDialogViewModel {

        public game: Interfaces.GameDescriptor;
        public specs: Interfaces.GameSpecification[];
        public selectedOptionIndex: number;
        public selectedSpec: Interfaces.GameSpecification;
        public maxOptionIndex: number;
    }
}
