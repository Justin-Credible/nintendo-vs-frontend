
namespace JustinCredible.NintendoVsFrontend.Renderer.ViewModels {

    export class MenuViewModel {
        public title: string;
        public player1Prompt: string;
        public player2Prompt: string;

        public games: Interfaces.GameDescriptor[];
        public selectedGame: Interfaces.GameDescriptor;
        public activePlayer: Enums.Player;
    }
}
