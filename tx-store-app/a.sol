// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FinancialRecords {
    struct Record {
        string description;
        int256 amount;
        string category;
        uint256 timestamp;
        string notes;
    }

    mapping(address => Record[]) private userRecords;

    event RecordAdded(
        address indexed user,
        uint256 indexed index,
        string description,
        int256 amount,
        string category,
        uint256 timestamp,
        string notes
    );

    function addRecord(
        string memory _description,
        int256 _amount,
        string memory _category,
        string memory _notes
    ) public {
        Record memory newRecord = Record(
            _description,
            _amount,
            _category,
            block.timestamp,
            _notes
        );
        userRecords[msg.sender].push(newRecord);

        emit RecordAdded(
            msg.sender,
            userRecords[msg.sender].length - 1,
            _description,
            _amount,
            _category,
            block.timestamp,
            _notes
        );
    }

    function addRecords(
        string[] memory _descriptions,
        uint256[] memory _amounts,
        string[] memory _categories,
        string[] memory _notes,
        bool[] memory _isExpense
    ) public {
        require(
            _descriptions.length == _amounts.length &&
            _amounts.length == _categories.length &&
            _categories.length == _notes.length &&
            _notes.length == _isExpense.length,
            "Input array length mismatch"
        );

        for (uint256 i = 0; i < _descriptions.length; i++) {
            int256 signedAmount = _isExpense[i]
                ? -int256(_amounts[i])
                : int256(_amounts[i]);

            addRecord(_descriptions[i], signedAmount, _categories[i], _notes[i]);
        }
    }

    function getRecordCount() public view returns (uint256) {
        return userRecords[msg.sender].length;
    }

    function getRecord(uint256 index)
        public
        view
        returns (
            string memory description,
            int256 amount,
            string memory category,
            uint256 timestamp,
            string memory notes
        )
    {
        require(index < userRecords[msg.sender].length, "Index out of bounds");
        Record memory r = userRecords[msg.sender][index];
        return (r.description, r.amount, r.category, r.timestamp, r.notes);
    }

    function getAllRecords() public view returns (Record[] memory) {
        return userRecords[msg.sender];
    }
}
