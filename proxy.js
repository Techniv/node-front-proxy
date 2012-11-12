
try{
	require('colors');
	var logger		= console,
		util		= require('util'),
		http		= require('http'),
		path		= require('path'),
		proxyLib	= require('http-proxy'),
		cmdConf		= require('cmd-conf');
} catch(err){
	console.log("ERROR: Can't load required modules. Launch `npm install`.");
	console.log(err.stack);
	process.exit(1);
}

console.log("");
console.log("=========================");
console.log("Starting NODE-FRONT-PROXY".green);
console.log("=========================");
console.log("");

// Get application path.
var appPath = path.dirname(process.mainModule.filename)+'/';


// Loading config with cmd-conf.
try {
	var config = cmdConf.getParameters();
} catch(err){
	console.error("Loading proxy config:"+" FAIL".red);
	console.error(err.stack.yellow);
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
	console.error("Loading proxy rules:"+" FAIL".red);
	console.error(err.stack.yellow);
	process.exit(1);
}
console.log("Loading proxy rules:"+" OK".green);


console.log("Applicable rules:".yellow);
for(var key in rules){
	console.log(key.green+": "+util.inspect(rules[key]).yellow);
}
console.log("=========================");
console.log("");


// Proxy method
console.log("Creating proxy server");
var server = proxyLib.createServer(function(request, response, proxy){
	var target;
	var requestHost = request.headers.host;
	if(typeof requestHost == "undefined"){
		logger.error("Invalid request");
		return;
	}
	if(rules[requestHost]){
		target = rules[requestHost];
		logger.info(requestHost.green
			+": routed on "+(target.host+":"+target.port).yellow
		);
	} else{
		target = rules["default"];
		logger.info(requestHost.yellow
			+": routed on "+(target.host+":"+target.port).yellow
		);
	}
	
	proxy.proxyRequest(request, response, target);	
});

// WebSocket
server.on('upgrade',function(request, socket, head){
	var target;
	var requestHost = request.headers.host;
	if(typeof requestHost == "undefined"){
		logger.error("Invalid request");
		return;
	}
	if(rules[requestHost]){
		target = rules[requestHost];
		logger.info(requestHost.green
			+": routed on "+(target.host+":"+target.port).yellow
			+" [sock]"
		);
	} else{
		target = rules["default"];
		logger.info(requestHost.yellow
			+": routed on "+(target.host+":"+target.port).yellow
			+" [sock]"
		);
	}
	
	var proxy = new proxyLib.HttpProxy({target:target});
	proxy.proxyWebSocketRequest(request, socket, head);
})

// Launch server
server.listen(config.listenPort);
console.log("Starting server on port"+config.listenPort+": "+"OK".green);
