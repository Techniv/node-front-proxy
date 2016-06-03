node-front-proxy
================

A simple frontal proxy for dispatching Web requests. HTTP &amp; WebSocket.
*Work on node 0.12 and older*

node-front-proxy is published under [GNU GPL 3.0 license](https://github.com/Techniv/node-front-proxy/blob/master/license/gpl-3.0.md).

# Configuration
Copy or rename the file `rules-template.js` to 'rules.js'. It contain all routes of proxy.
```javascript
module.exports = {
	// The default rules for unrecognized request.
	'default': {
		host: '127.0.0.1',
		port: 81
	},

	// Other rules
	'my.host.name':{
		host: '192.168.1.20',
		port: 8080
	}
};
```

# Run the proxy
When your rule file is ready, you can launch the proxy with the file `proxy.js`.
```shell
node proxy.js
```

By default the proxy listen on port 80. You can change this with the option `p`.
```shell
node proxy.js -p 85
```

I recommend to lunch the proxy in a [multiplexed screen](http://www.gnu.org/software/screen/manual/screen.html)
to detach the terminal and return later to control the proxy.
```shell
screen -R proxy
node proxy.js
```
Use `Ctrl`+`A`, `D` in the screen to detach the terminal without kill the process.

# Control the proxy
Under the proxy console, you can view in real time all access logs.

You can also use some commands to control the proxy :
 * **help**: display the command list.
 * **quit**: stop and close the proxy.
 * **reload**: reload all the rules from the rule file.