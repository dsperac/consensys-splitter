pragma solidity ^0.4.5;

contract Splitter {
    address owner;
    address public alice;
    address public bob;
    address public carol;
    bool isSending;
    
    function Splitter(address _alice, address _bob, address _carol) payable {
        require (_alice != address(0));
        require (_bob != address(0));
        require (_carol != address(0));
        
        owner = msg.sender;
        alice = _alice;
        bob = _bob;
        carol = _carol;
    }

    function splitBalance() private {
        var bobsShare = this.balance / 2;
        var carolsShare = this.balance / 2;
        
        if (bobsShare == 0 || !bob.send(bobsShare)) revert();
        if (carolsShare == 0 || !carol.send(carolsShare)) revert();
        
        // handle odd amount of balance by giving back the owner 1 wei
        if (this.balance != 0 && !owner.send(this.balance)) revert();
        
        isSending = false;
    }

    function killMe() {
        require(msg.sender == owner);
        
        suicide(owner);
    }

    function () payable {
        require(msg.value > 0);
        
        if (msg.sender == alice && !isSending) {
            isSending = true;
            splitBalance();
        }
    }
}
