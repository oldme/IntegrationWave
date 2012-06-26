/**
 * Created with JetBrains WebStorm.
 * User: sinica
 * Date: 6/8/12
 * Time: 10:52 PM
 * To change this template use File | Settings | File Templates.
 */
process.on('uncaughtException', function(err) {
        console.log("" + err);
        console.log(err.stack);
});

var thisAdaptor;

process.on('message', function(m){
     redisPort       = m.redisPort;
    thisAdaptor = require('./Adaptor.js').init("Logger",m.redisHost, m.redisPort);
    thisAdaptor.loadSwarmingCode();

    thisAdaptor.addAPIFunction("print", console.log);
});


