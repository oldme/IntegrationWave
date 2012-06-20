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

var redisHost       = "localhost";
var redisPort       = 6379;
var thisAdaptor;
var serverPort      = 3000;


thisAdaptor.addAPIFunction("", function()
    {

    }
);


function ClientTcpServer(port,adaptor)
{
    console.log("Starting client server on 3000");
    var net   	= require('net');
    this.server = net.createServer(
        function (socket){
            var parser = require("FastJSONParser").createFastParser(
                function (newObjectFromSocket){
                    thisAdaptor.execute(newObjectFromSocket);
                }
            );
            socket.on('data', function (data){
                parser.parseNewData(data.toString('utf8'));
            });
        }
    );
    this.server.listen(port);
};

process.on('message', function(m) {
    //console.log('CHILD got message:', m);
    redisHost       = m.redisHost;
    redisPort       = m.redisPort;
    thisAdaptor = require('./Adaptor.js').init("ClientAdaptor",redisHost,redisPort);
    thisAdaptor.loadSwarmingCode();
    new ClientTcpServer(serverPort);
});

