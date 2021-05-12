import json
import pickle
from game import Board, Game
from mcts_pure import MCTSPlayer as MCTS_Pure
from mcts_alphaZero import MCTSPlayer
from model import PolicyValueNet
import os
os.environ["CUDA_VISIBLE_DEVICES"] = "0"


class Gomoku_API:
    def __init__(self):
        n = 5
        self.width, self.height = 10, 10
        self.board = Board(width=self.width, height=self.height, n_in_row=n)
        self.game = Game(self.board)
        self.mcts_player = self.ai_player()

    def ai_player(self):
        model_file = 'model\\best_policy.model'
        policy_param = pickle.load(open(model_file, 'rb'), encoding='bytes')
        best_policy = PolicyValueNet(self.width, self.height, model_file)
        mcts_player = MCTSPlayer(best_policy.policy_value_fn, c_puct=5, n_playout=800)
        return mcts_player

    def init_game(self, first_player):
        _x, _y = 0, 0
        self.game.board.init_board()
        if first_player == "AI":
            _move = self.mcts_player.get_action(self.game.board)
            _x, _y = self.board.move_to_location(_move)
            self.game.board.do_move(_move)
        return json.dumps({"x": float(_x), "y": float(_y)})

    def move(self, is_human, x=None, y=None):
        _x, _y = 0, 0,
        if is_human:
            _move = self.board.location_to_move([x, y])
        else:
            _move = self.mcts_player.get_action(self.game.board)
            _x, _y = self.board.move_to_location(_move)
        self.game.board.do_move(_move)
        end, winner = self.game.board.game_end()
        return json.dumps({"x": float(_x), "y": float(_y), "end": end, "winner": winner})
