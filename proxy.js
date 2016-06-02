/*
 * This file is part of Node-Front-Proxy.
 * 
 * Node-Front-Proxy is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var rules, oldRules;
try{
	require('colors');
	var logger		= console,
		util		= require('util'),
		http		= require('http'),
		path		= require('path'),
		proxyLib	= require('http-proxy'),
		cmdConf		= require('cmd-conf'),
		commandio	= require('command.io');
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
	loadingRules();
} catch (err){
	terminated(err);
}


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
		if(typeof target.plugin == 'string'){
			var pluginPath = './plugins/'+target.plugin;
			try{
				logger.info(requestHost.green
					+": routed by "+(target.plugin+" plugin").yellow
				);
				var plugin = require(pluginPath);
				plugin(request, response, target, proxy);
				return;
			} catch (e){
				logger.error("Error with routing plugin: "+ e.message);
				logger.error(e.stack);
				response.writeHead(502, {
					"Status": "502 Bad Gateway",
					"Content-Type": "text/plain"
				});
				response.write("Error 502 : Bad Gateway\n");
				response.write("Error with routing plugin: "+ e.message +"\n");
				response.end();
				return;
			}
		} else {
			logger.info(requestHost.green
				+": routed on "+(target.host+":"+target.port).yellow
			);
		}
	} else{
		target = rules["default"];
		logger.info(requestHost.yellow
			+": routed on "+(target.host+":"+target.port).yellow
		);
	}

	try {
		proxy.proxyRequest(request, response, target);
	} catch (e){
		console.error("Error".red+" on routing "
			+requestHost+" to "
			+(target.host+":"+target.port)
		);
		console.error(e.stack.red);
		console.error(JSON.stringify(request, undefined, 2));

		response.writeHead(502, {
			"Status": "502 Bad Gateway",
			"Content-Type": "text/plain"
		});
		response.write("Error 502 : Bad Gateway\n");
		response.write("Error with routing plugin: "+ e.message +"\n");
		response.end();
	}
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


/**
 * Load the proxy rules.
 */
function loadingRules(){
	oldRules = rules;

	console.log("");

	var rulesId, rulesPath = appPath+config.ruleFile;


	try{
		// Flush the cache if exist.
		rulesId = require.resolve(rulesPath);
		if(require.cache[rulesId]) delete require.cache[rulesId];
		// Load new rules.
		rules = require(rulesPath);
	} catch (err){
		console.error("Loading proxy rules:"+" FAIL".red);
		console.error(err.stack.yellow);
		throw err;
	}
	console.log("Loading proxy rules:"+" OK".green);


	displayRules();
}

function displayRules(){
	console.log("Applicable rules:".yellow);
	for(var key in rules){
		console.log(key.green+": "+util.inspect(rules[key]).yellow);
	}
	console.log("=========================");
	console.log("");
}

function terminated(err){
	console.log("");
	console.log("=============================");
	console.log(" NODE-FRONT-PROXY terminated ".red);
	console.log("=============================");
	console.log("");
	process.exit(typeof err == 'undefined' ? 0 : 1);
}

// Command.IO
commandio.addCommand({
	name: 'reload',
	description: 'Reload the proxy rules from the file',
	action: loadingRules,
	catchNativeError: function(err){
		rules = oldRules;
		console.log("\n=========================");
		console.log("Error on reloading rules.".red);
		console.log("Preview rules are restored.".red);
		displayRules();
	}
});

commandio.beforeExit(function(){
	terminated();
})
