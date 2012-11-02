var logger = console;
logger.log("");
try{
	require('colors');
	var util		= require('util'),
		http		= require('http'),
		path		= require('path'),
		proxyLib	= require('http-proxy'),
		cmdConf		= require('cmd-conf');
} catch(err){
	logger.log("ERROR: Can't load required modules. Launch `npm install`.");
	logger.log(err.stack);
	process.exit(1);
}

logger.log("=========================");
logger.log("Starting NODE-FRONT-PROXY".green);
logger.log("=========================");
logger.log("");

// Get application path.
var appPath = path.dirname(process.mainModule.filename)+'/';


// Loading config with cmd-conf.
try {
	var config = cmdConf.getParameters();
} catch(err){
	logger.log("Loading proxy config:"+" FAIL".red);
	logger.log(err.stack.yellow);
	process.exit(1);
}
logger.log("Loading proxy config:"+" OK".green);
logger.log("Rule's file: "+config.ruleFile.yellow)
logger.log("Listen port: "+(""+config.listenPort).yellow)
logger.log("=========================");
logger.log("");


// Loading rules.
try{
	var rules = require(appPath+config.ruleFile);
} catch (err){
	logger.log("Loading proxy rules:"+" FAIL".red);
	logger.log(err.stack.yellow);
	process.exit(1);
}
logger.log("Loading proxy rules:"+" OK".green);


logger.log("Applicable rules:".yellow);
for(var key in rules){
	logger.log(key.green+": "+util.inspect(rules[key]).yellow);
}
logger.log("=========================");
logger.log("");



