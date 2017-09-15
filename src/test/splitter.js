var Splitter = artifacts.require("./Splitter.sol");

contract('Splitter', function (accounts) {

  var owner = accounts[0];
  var alice = accounts[1];
  var bob = accounts[2];
  var carol = accounts[3];
  var contract;

  beforeEach(() => {
    return Splitter.new(alice, bob, carol, { from: owner }).then(instance => contract = instance);
  });

  it ("should deploy properly", () => {
    return contract.alice().then((a) => {
      assert.equal(a, alice, "Alice's address does not match");
      return contract.bob();
    }).then((b) => {
      assert.equal(b, bob, "Bob's address does not match");
      return contract.carol();
    }).then((c) => {
      assert.equal(c, carol, "Carol's address does not match");
      return web3.eth.getBalance(contract.address);
    }).then((contractBalance) => {
      assert.equal(contractBalance.toString(10), "0");
    });
  });

  it ("should contribute and not split funds when funder not Alice", () => {
    return contract.sendTransaction({ from: owner, value: web3.toWei(1, "ether") }).then(() => {
      return web3.eth.getBalance(contract.address);
    }).then((contractBalance) => {
      assert.equal(contractBalance.toString(10), web3.toWei(1, "ether"));
    }).then(() => {
      return contract.sendTransaction({ from: owner, value: web3.toWei(1, "ether") })
    }).then(() => {
      return web3.eth.getBalance(contract.address);
    }).then((contractBalance) => {
      assert.equal(contractBalance.toString(10), web3.toWei(2, "ether"));
    });
  });
  
  it ("should properly split when Alice contributes", () => {
    var contractBalance = web3.eth.getBalance(contract.address);
    var bobBalance = web3.eth.getBalance(bob);
    var carolBalance = web3.eth.getBalance(carol);

    return contract.sendTransaction({ from: owner, value: web3.toWei(1, "ether") }).then(() => {
      return contract.sendTransaction({ from: alice, value: web3.toWei(2, "ether") });
    }).then(() => {
      var newContractBalance = web3.eth.getBalance(contract.address);
      var newBobBalance = web3.eth.getBalance(bob);
      var newCarolBalance = web3.eth.getBalance(carol);

      assert.equal(newContractBalance.toString(10), "0");
      assert.equal(newBobBalance.toString(10), bobBalance.plus(web3.toWei(3, "ether") / 2).toString(10));
      assert.equal(newCarolBalance.toString(10), carolBalance.plus(web3.toWei(3, "ether") / 2).toString(10));
    });
  });

  it ("should properly suicide and send funds to owner", () => {
    var ownerBalance = web3.eth.getBalance(owner);

    return contract.sendTransaction({ from: bob, value: web3.toWei(10, "ether") }).then(() => {
      return contract.killMe.sendTransaction({ from: owner });
    }).then(() => {
      var newOwnerBalance = web3.eth.getBalance(owner);
      var newContractBalance = web3.eth.getBalance(contract.address);

      assert.equal(newContractBalance.toString(10), "0");
      assert.isTrue(newOwnerBalance.greaterThan(ownerBalance));
    });
  });
});
