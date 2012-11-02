
console.log("");
try{
	require('colors');
	var util		= require('util'),
		http		= require('http'),
		path		= require('path'),
		proxyLib	= require('http-proxy'),
		cmdConf		= require('cmd-conf');
} catch(err){
	console.log("ERROR: Can't load required modules. Launch `npm install`.");
	console.log(err.stack);
	process.exit(1);
}

console.log("=========================");
console.log("Starting NODE-FRONT-PROXY".green);
console.log("=========================");
console.log("");

// Get Application path.
var appPath = path.dirname(process.mainModule.filename)+'/';

// Loading config with cmd-conf.
try {
	var config = cmdConf.getParameters();
} catch(err){
	console.log("Loading proxy config:"+" FAIL".red);
	console.log(err.stack.yellow);
	process.exit(1);
}
console.log("Loading proxy config:"+" OK".green);
console.log("Rule's file: "+config.ruleFile.yellow)
console.log("Listen port: "+(""+config.listenPort).yellow)
console.log("=========================");
console.log("");
// Loading rules.
try{
	var rules = require(appPath+config.ruleFile);
} catch (err){
	console.log("Loading proxy rules:"+" FAIL".red);
	console.log(err.stack.yellow);
	process.exit(1);
}
console.log("Loading proxy rules:"+" OK".green);


console.log("Applicable rules:".yellow);
for(var key in rules){
	console.log(key.green+": "+util.inspect(rules[key]).yellow);
}
console.log("=========================");
console.log("");

