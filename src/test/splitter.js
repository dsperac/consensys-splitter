var Splitter = artifacts.require("./Splitter.sol");
var Promise = require("bluebird");
var _ = require("underscore");

Promise.promisifyAll(web3.eth);

contract('Splitter', function (accounts) {

  var owner = accounts[0];
  var alice = accounts[1];
  var bob = accounts[2];
  var carol = accounts[3];
  var contract;

  beforeEach(() => {
    return Splitter.new({ from: owner }).then(instance => contract = instance);
  });

  it ("should deploy properly", () => {
    return web3.eth.getBalanceAsync(contract.address).then(contractBalance => {
      assert.equal(contractBalance.toString(10), "0");
    });
  });

  it ("should let a person withdraw then they have a positive balance", () => {
    var originalBobsBalance;

    return web3.eth.getBalanceAsync(bob)
    .then(balance => {
      originalBobsBalance = balance;
      return contract.contributeAndSplit(bob, carol, { from: alice, value: web3.toWei(2, "ether") });
    }).then((tx) => {
      assert.isTrue(!_.isUndefined(tx.receipt));

      var onContributionEvent = _(tx.logs).findWhere({ event: "OnContribution" });
      assert.isTrue(!_.isUndefined(onContributionEvent));

      return contract.accounts(bob);
    }).then(bobsContractBalance => {
      assert.isTrue(bobsContractBalance.greaterThan(0));

      return contract.withdraw({ from: bob });
    }).then(tx => {
      assert.isTrue(!_.isUndefined(tx.receipt));

      var onWithdrawalEvent = _(tx.logs).findWhere({ event: "OnWithdrawal" });
      assert.isTrue(!_.isUndefined(onWithdrawalEvent));

      return web3.eth.getBalanceAsync(bob); 
    }).then(balance => {
      assert.isTrue(balance.greaterThan(originalBobsBalance));
    });
  });

  it ("should reject withdrawal on 0 balance", () => {
    return contract.accounts(bob)
    .then(bobsContractBalance => {
      assert.equal(bobsContractBalance.toString(10), "0");

      return contract.withdraw.sendTransaction({ from: bob });
    })
    .then(assert.fail)
    .catch(_.noop);
  });
  
  it ("should properly split when Alice contributes", () => {
    var originalContractBalance;
    var originalBobsContractAccount;
    var originalCarolsContractAccount;

    return Promise.all([
      web3.eth.getBalanceAsync(contract.address),
      contract.accounts(bob),
      contract.accounts(carol)
    ]).then(results => {
      originalContractBalance = results[0];
      originalBobsContractAccount = results[1];
      originalCarolsContractAccount = results[2];

      return contract.contributeAndSplit(bob, carol, { from: alice, value: web3.toWei(2, "ether") });
    }).then((tx) => {
      assert.isTrue(!_.isUndefined(tx.receipt));

      var onContributionEvent = _(tx.logs).findWhere({ event: "OnContribution" });
      assert.isTrue(!_.isUndefined(onContributionEvent));

      return contract.contributeAndSplit(bob, carol, { from: alice, value: 1 });
    }).then((tx) => {
      assert.isTrue(!_.isUndefined(tx.receipt));

      var onContributionEvent = _(tx.logs).findWhere({ event: "OnContribution" });
      assert.isTrue(!_.isUndefined(onContributionEvent));

      var contractBalancePromise = web3.eth.getBalanceAsync(contract.address);
      var alicesContractAccountPromise = contract.accounts(alice);
      var bobsContractAccountPromise = contract.accounts(bob);
      var carolsContractAccountPromise = contract.accounts(carol);

      return Promise.all([contractBalancePromise, alicesContractAccountPromise, bobsContractAccountPromise, carolsContractAccountPromise]);
    }).then(results => {
      var contractBalance = results[0];
      var alicesContractAccount = results[1];
      var bobsContractAccount = results[2];
      var carolsContractAccount = results[3];
      
      assert.equal(contractBalance.toString(10), originalContractBalance.plus(web3.toWei(2, "ether")).plus(1).toString(10));
      assert.equal(alicesContractAccount.toString(10), "1");
      assert.equal(bobsContractAccount.toString(10), originalBobsContractAccount.plus(web3.toWei(2, "ether")).plus(1).dividedToIntegerBy(2).toString(10), "w2");
      assert.equal(carolsContractAccount.toString(10), originalCarolsContractAccount.plus(web3.toWei(2, "ether")).plus(1).dividedToIntegerBy(2).toString(10), "w3");
    });
  });

  it ("should not allow non owner to suicide", () => {
    return contract.contributeAndSplit(bob, carol, { from: alice, value: web3.toWei(10, "ether") })
    .then(tx => {
      assert.isTrue(!_.isUndefined(tx.receipt));

      var onContributionEvent = _(tx.logs).findWhere({ event: "OnContribution" });
      assert.isTrue(!_.isUndefined(onContributionEvent));

      return contract.killMe.sendTransaction({ from: alice });
    }).then(assert.fail)
    .catch(_.noop);
  });

  it ("should properly suicide and send funds to owner", () => {
    var originalOwnerBalance;

    return web3.eth.getBalanceAsync(owner)
    .then(balance => {
      originalOwnerBalance = balance;
      return contract.contributeAndSplit(bob, carol, { from: alice, value: web3.toWei(10, "ether") });
    }).then(tx => {
      assert.isTrue(!_.isUndefined(tx.receipt));

      var onContributionEvent = _(tx.logs).findWhere({ event: "OnContribution" });
      assert.isTrue(!_.isUndefined(onContributionEvent));

      return contract.killMe.sendTransaction({ from: owner });
    }).then(() => {
      var ownerBalancePromise = web3.eth.getBalanceAsync(owner);
      var contractBalancePromise = web3.eth.getBalanceAsync(contract.address);

      return Promise.all([ownerBalancePromise, contractBalancePromise]);
    }).then(results => {
      var ownerBalance = results[0];
      var contractBalance = results[1];

      assert.equal(contractBalance.toString(10), "0");
      assert.isTrue(ownerBalance.greaterThan(originalOwnerBalance));
    });
  });
});
