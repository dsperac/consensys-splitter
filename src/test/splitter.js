var Splitter = artifacts.require("./Splitter.sol");

contract('Splitter', function(accounts) {

  var owner = accounts[0];
  var alice = accounts[1];
  var bob = accounts[2];
  var carol = accounts[3];
  var contract;

  beforeEach(function () {
    return Splitter.new(alice, bob, carol, { from: owner }).then(instance => contract = instance);
  });

  it ("should deploy properly", function () {
    return contract.alice().then(function (a) {
      assert.equal(a, alice, "Alice's address does not match");
      return contract.bob();
    }).then(function (b) {
      assert.equal(b, bob, "Bob's address does not match");
      return contract.carol();
    }).then(function (c) {
      assert.equal(c, carol, "Carol's address does not match");
      return web3.eth.getBalance(contract.address);
    }).then(function (contractBalance) {
      assert.equal(contractBalance.toString(10), "0");
    });
  });

  it ("should contribute and not split funds when funder not Alice", function () {
    return contract.sendTransaction({ from: owner, value: web3.toWei(1, "ether") }).then(function () {
      return web3.eth.getBalance(contract.address);
    }).then(function (contractBalance) {
      assert.equal(contractBalance.toString(10), web3.toWei(1, "ether"));
    }).then(function () {
      return contract.sendTransaction({ from: owner, value: web3.toWei(1, "ether") })
    }).then(function () {
      return web3.eth.getBalance(contract.address);
    }).then(function (contractBalance) {
      assert.equal(contractBalance.toString(10), web3.toWei(2, "ether"));
    });
  });
  
  it ("should properly split when Alice contributes", function () {
    var contractBalance = web3.eth.getBalance(contract.address);
    var bobBalance = web3.eth.getBalance(bob);
    var carolBalance = web3.eth.getBalance(carol);

    return contract.sendTransaction({ from: owner, value: web3.toWei(1, "ether") }).then(function () {
      return contract.sendTransaction({ from: alice, value: web3.toWei(2, "ether") });
    }).then(function () {
      var newContractBalance = web3.eth.getBalance(contract.address);
      var newBobBalance = web3.eth.getBalance(bob);
      var newCarolBalance = web3.eth.getBalance(carol);

      assert.equal(newContractBalance.toString(10), "0");
      assert.equal(newBobBalance.toString(10), bobBalance.plus(web3.toWei(3, "ether") / 2).toString(10));
      assert.equal(newCarolBalance.toString(10), carolBalance.plus(web3.toWei(3, "ether") / 2).toString(10));
    });
  });

  it ("should properly suicide and send funds to owner", function () {
    var ownerBalance = web3.eth.getBalance(owner);

    return contract.sendTransaction({ from: bob, value: web3.toWei(10, "ether") }).then(function () {
      return contract.killMe.sendTransaction({ from: owner });
    }).then(function () {
      var newOwnerBalance = web3.eth.getBalance(owner);
      var newContractBalance = web3.eth.getBalance(contract.address);

      assert.equal(newContractBalance.toString(10), "0");
      assert.isTrue(newOwnerBalance.greaterThan(ownerBalance));
    });
  });
});
