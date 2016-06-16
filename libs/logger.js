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

var path    = require('path'),
    fs      = require('fs'),
    cmdConf	= require('cmd-conf'),
    util    = require('util'),
    dates   = require('dates');

var logPath         = path.resolve(cmdConf.getParameters().logPath);
var logFileName     = 'error.log';
var logFilePath     = path.join(logPath, logFileName);
var stream;
var stdout          = process.stdout;
var stderr          = process.stderr;
var dateFormater    = dates.createFormatter('[yyyy-MM-dd HH:mm:ss.sss] ');

var logPathSeq = logPath.split(path.sep);

do {
    var tmpPath = path.join(logPathSeq.shift() || '/');

    if(!fs.existsSync(tmpPath)){
        fs.mkdirSync(tmpPath);
        continue;
    }
    
    if(!fs.lstatSync(tmpPath).isDirectory()) throw new Error('Logger Error: '+ tmpPath +'is not a directory.');
    
} while (logPathSeq.length);

stream = fs.createWriteStream(logFilePath);

function write(arg) {
    stream.write(arg);
    stderr.write(arg);
}

exports.log = function () {
    var str = util.format.apply(null, arguments);
    stdout.write(str);
    stdout.write('\n');
};

exports.info = exports.log;
exports.warn = exports.log;

exports.error = function error() {
    var date = dateFormater.format(new Date);

    write(date);
    for(var i = 0; i < arguments.length; i++){
        var arg = arguments[i];
        if(typeof arg === 'string'){
            write(arg);
            write('\n');
            return;
        }
        else if(typeof arg === 'object' && arg.message && arg.stack){
            write(arg.stack);
            write('\n');
        }
        else {
            write(util.format(arg));
        }
    }
};


