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
	var logger		= require('./libs/logger'),
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

logger.log("");
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
	logger.error("Loading proxy config:"+" FAIL".red);
	logger.error(err.stack.yellow);
	process.exit(1);
}
logger.log("Loading proxy config:"+" OK".green);
logger.log("Rule's file: "+config.ruleFile.yellow)
logger.log("Listen port: "+(""+config.listenPort).yellow)
logger.log("=========================");
logger.log("");


// Loading rules.
try{
	loadingRules();
} catch (err){
	terminated(err);
}


// Proxy method
logger.log("Creating proxy server");
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
		logger.error("Error".red+" on routing "
			+requestHost+" to "
			+(target.host+":"+target.port)
		);
		logger.error(e.stack.red);
		logger.error(JSON.stringify(request, undefined, 2));

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
logger.log("Starting server on port"+config.listenPort+": "+"OK".green);


/**
 * Load the proxy rules.
 */
function loadingRules(){
	oldRules = rules;

	logger.log("");

	var rulesId, rulesPath = appPath+config.ruleFile;


	try{
		// Flush the cache if exist.
		rulesId = require.resolve(rulesPath);
		if(require.cache[rulesId]) delete require.cache[rulesId];
		// Load new rules.
		rules = require(rulesPath);
	} catch (err){
		logger.error("Loading proxy rules:"+" FAIL".red);
		logger.error(err.stack.yellow);
		throw err;
	}
	logger.log("Loading proxy rules:"+" OK".green);


	displayRules();
}

function displayRules(){
	logger.log("Applicable rules:".yellow);
	for(var key in rules){
		logger.log(key.green+": "+util.inspect(rules[key]).yellow);
	}
	logger.log("=========================");
	logger.log("");
}

function terminated(err){
	logger.log("");
	logger.log("=============================");
	logger.log(" NODE-FRONT-PROXY terminated ".red);
	logger.log("=============================");
	logger.log("");
	process.exit(typeof err == 'undefined' ? 0 : 1);
}

// Command.IO
commandio.addCommand({
	name: 'reload',
	description: 'Reload the proxy rules from the file',
	action: loadingRules,
	catchNativeError: function(err){
		rules = oldRules;
		logger.log("\n=========================");
		logger.log("Error on reloading rules.".red);
		logger.log("Preview rules are restored.".red);
		displayRules();
	}
});

commandio.addCommand({
	name: 'list',
	description: 'Display the current proxy rules',
	action: displayRules
});

commandio.beforeExit(function(){
	terminated();
})
