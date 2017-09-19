pragma solidity ^0.4.5;

import "./Ownable.sol";

contract Splitter is Ownable {
    mapping(address => uint256) public accounts;
    
    event OnContribution(address indexed contributor, address indexed account1, address indexed account2, uint amountContributed);
    event OnWithdrawal(address indexed account, uint amountWithdrawn);

    function contributeAndSplit(address account1, address account2) payable public {
        require (account1 != address(0));
        require (account2 != address(0));
        require (account1 != account2);
        require (msg.value > 0);

        uint sharePerAccount = msg.value / 2;
        
        accounts[account1] += sharePerAccount;
        accounts[account2] += sharePerAccount;

        if (msg.value % 2 != 0) {
            accounts[msg.sender] = 1;
        }

        OnContribution(msg.sender, account1, account2, msg.value);
    }

    function withdraw() public {
        uint senderBalance = accounts[msg.sender];

        require(senderBalance > 0);

        msg.sender.transfer(senderBalance);
        accounts[msg.sender] = 0;

        OnWithdrawal(msg.sender, senderBalance);
    }

    function killMe() onlyOwner {
        selfdestruct(owner);
    }
}
