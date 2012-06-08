/**
 * Created with JetBrains WebStorm.
 * User: sinica
 * Date: 6/7/12
 * Time: 9:06 PM
 * To change this template use File | Settings | File Templates.
 */

/*
 Arguments: scriptsFolder redisHost redisPort

*/

process.on('uncaughtException', function(err) {

    if( err  instanceof ReferenceError){
        console.log(err);
    }
    else
    {
        console.log("" + err);
        console.log(err.stack);
    }
});

var wavesFolder   = "waves";
var redisHost       = "localhost";
var redisPort       = 6379;

if(process.argv.length != 5){
    console.log("Usage: "+ process.argv[1] + " wavesFolder redisHost redisPort");
    console.log("Using default values:"+ "waves localhost 6379");
}
else{
    wavesFolder     = process.argv[1];
    redisHost       = process.argv[2];
    redisPort       = process.argv[3];
}


var adaptor = require('./Adaptor.js').init("core",redisHost,redisPort);

adaptor.uploadWaves(wavesFolder);
console.log("Starting....");
adaptor.loadMyCode();

setTimeout(
    function(){
        adaptor.startWave("LaunchingTest.js");
        adaptor.startWave("BenchMark.js",10000);
    },
100);
