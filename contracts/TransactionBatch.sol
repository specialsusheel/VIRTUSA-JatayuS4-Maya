// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

contract TransactionBatch {
    struct Transaction {
        uint256 timestamp;
        string description;
        int256 amount;
        string category;
    }

    mapping(address => Transaction[]) public userTransactions;

    event BatchStored(address indexed user, uint256 count);

    function storeBatch(
        string[] memory descriptions,
        int256[] memory amounts,
        string[] memory categories
    ) external {
        require(
            descriptions.length == amounts.length &&
            amounts.length == categories.length,
            "Input array lengths must match"
        );

        for (uint256 i = 0; i < descriptions.length; i++) {
            Transaction memory txRecord = Transaction({
                timestamp: block.timestamp,
                description: descriptions[i],
                amount: amounts[i],
                category: categories[i]
            });

            userTransactions[msg.sender].push(txRecord);
        }

        emit BatchStored(msg.sender, descriptions.length);
    }

    function getTransactions(address user) external view returns (Transaction[] memory) {
        return userTransactions[user];
    }
}
