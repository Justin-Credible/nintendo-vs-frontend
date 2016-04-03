
namespace JustinCredible.NintendoVsFrontend.Renderer.ViewModels {

    export class MenuViewModel {
        public title: string;
        public player1Prompt: string;
        public player2Prompt: string;

        public games: Interfaces.GameDescriptor[];
        public gamesForPage: Interfaces.GameDescriptor[];

        public activePlayer: Enums.Player;
        public selectedGame: Interfaces.GameDescriptor;
        public currentPageIndex: number;
    }
}
