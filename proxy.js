
console.log("");
try{
	require('colors');
	var util		= require('util'),
		http		= require('http'),
		proxyLib	= require('http-proxy');
} catch(err){
	console.log("ERROR: Can't load required modules. Launch `npm install`.");
	console.log(err.stack);
	process.exit(1);
}

console.log("=========================");
console.log("Starting NODE-FRONT-PROXY".green);
console.log("=========================");
console.log("");

try{
	var rules = require('./rules.js');
} catch (err){
	console.log("Loading proxy rules:"+" FAIL".red);
	console.log(err.stack.red);
	process.exit(1);
}
console.log("Loading proxy rules:"+" OK".green);


console.log("Applicable rules:".yellow);
for(var key in rules){
	console.log(key.green+": "+util.inspect(rules[key]).yellow);
}
console.log("===================");
console.log("");
