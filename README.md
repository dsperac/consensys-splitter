# Splitter Contract

A smart contract designed to enable funds splitting to defined addresses.

* The contract keeps an internal list of balances
* Funding and splitting is enabled via a contribution function which takes 2 addresses as parameters
* After contributing the owners of the addresses are able to withdraw their share of the funds (half of the contribution amount for each contribution specifying that address)
* Also includes a selfdestruct function for the contract owner