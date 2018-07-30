// Temporary test script

const { Zilliqa } = require('../../index.js');

let zilliqa = new Zilliqa({
    nodeUrl: 'https://api-scilla.zilliqa.com'
});

let node = zilliqa.getNode();

// use API methods
node.getBalance({ address: 'E8A67C0B1F19DF61A28E8E8FB5D830377045BCC7' }, callback);

// callback receives 2 parameters, error and result
function callback (err, data) {
    if (err || data.error) {
        console.log('Error')
    } else {
    	console.log("here")
        console.log(data.result)
    }
}


// generate a private key and its public address
let pk = zilliqa.util.generatePrivateKey();
let address = zilliqa.util.getAddressFromPrivateKey(pk);
console.log(pk.toString('hex'))
console.log(address.toString('hex'))
