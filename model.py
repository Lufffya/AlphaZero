# -*- coding: utf-8 -*-
"""
An implementation of the PolicyValueNet with tensorflow
Using tensorflow GPU 2.3.0 and python 3.8.0
"""

import pickle
import numpy as np
from tensorflow.keras import Input, Model, backend as K
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.regularizers import l2
from tensorflow.keras.layers import Dense, Conv2D, Flatten
import os
os.environ["CUDA_VISIBLE_DEVICES"] = "0"


class PolicyValueNet:
    def __init__(self, board_width, board_height, model_file=None):
        self.board_width = board_width
        self.board_height = board_height
        self.l2_const = 1e-4  # coef of l2 penalty
        self.model = self.build_policy_value_net()

        if model_file:
            net_params = pickle.load(open(model_file, 'rb'))
            self.model.set_weights(net_params)

    def build_policy_value_net(self):
        input_x = network = Input((4, self.board_width, self.board_height))
        # conv layers
        network = Conv2D(filters=32, kernel_size=(3, 3), padding="same", data_format="channels_first", activation="relu", kernel_regularizer=l2(self.l2_const))(network)
        network = Conv2D(filters=64, kernel_size=(3, 3), padding="same", data_format="channels_first", activation="relu", kernel_regularizer=l2(self.l2_const))(network)
        network = Conv2D(filters=128, kernel_size=(3, 3), padding="same", data_format="channels_first", activation="relu", kernel_regularizer=l2(self.l2_const))(network)
        # action policy layers
        policy_net = Conv2D(filters=4, kernel_size=(1, 1), data_format="channels_first", activation="relu", kernel_regularizer=l2(self.l2_const))(network)
        policy_net = Flatten()(policy_net)
        policy_net = Dense(self.board_width*self.board_height, activation="softmax", kernel_regularizer=l2(self.l2_const))(policy_net)
        # state value layers
        value_net = Conv2D(filters=2, kernel_size=(1, 1), data_format="channels_first", activation="relu", kernel_regularizer=l2(self.l2_const))(network)
        value_net = Flatten()(value_net)
        value_net = Dense(64, kernel_regularizer=l2(self.l2_const))(value_net)
        value_net = Dense(1, activation="tanh", kernel_regularizer=l2(self.l2_const))(value_net)
        # bulid model
        model = Model(input_x, [policy_net, value_net])
        model.compile(optimizer=Adam(), loss=["categorical_crossentropy", "mean_squared_error"])
        model.summary()
        return model

    def policy_value(self, state_input):
        state_input_union = np.array(state_input)
        results = self.model.predict_on_batch(state_input_union)
        return results

    def policy_value_fn(self, board):
        """
        input: board
        output: a list of (action, probability) tuples for each available action and the score of the board state
        """
        legal_positions = board.availables
        current_state = board.current_state()
        act_probs, value = self.policy_value(np.expand_dims(current_state, axis=0))
        act_probs = zip(legal_positions, act_probs.flatten()[legal_positions])
        return act_probs, np.squeeze(value)

    @staticmethod
    def self_entropy(probs):
        return -np.mean(np.sum(probs * np.log(probs + 1e-10), axis=1))

    def train_step(self, state_input, mcts_probs, winner, learning_rate):
        state_input_union = np.array(state_input)
        mcts_probs_union = np.array(mcts_probs)
        winner_union = np.array(winner)
        # evaluate loss index before training
        loss = self.model.evaluate(state_input_union, [mcts_probs_union, winner_union], batch_size=len(state_input), verbose=0)
        action_probs, _ = self.model.predict_on_batch(state_input_union)
        entropy = self.self_entropy(action_probs)
        # dynamically adjust the learning rate
        K.set_value(self.model.optimizer.lr, learning_rate)
        # training model
        self.model.fit(state_input_union, [mcts_probs_union, winner_union], batch_size=len(state_input), verbose=0)
        return loss[0], entropy

    def get_policy_param(self):
        net_params = self.model.get_weights()
        return net_params

    def save_model(self, model_file):
        """ save model params to file """
        net_params = self.get_policy_param()
        pickle.dump(net_params, open(model_file, 'wb'), protocol=2)
