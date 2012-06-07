/**
 * Created with JetBrains WebStorm.
 * User: sinica
 * Date: 6/7/12
 * Time: 11:36 PM
 * To change this template use File | Settings | File Templates.
 */

var redis = require("redis");
var fs = require('fs');

function AdaptorBase(actorName){
    this.actorName = actorName;
}

exports.init = function(actorName,redisHost,redisPort)
{
    var adaptor = new AdaptorBase(actorName);
    redisClient = redis.createClient(redisPort,redisHost);
    redisClient.subscribe(actorName);
    redisClient.on("message", function (channel, message) {
        console.log("Got message " + channel + ": " + message);
        //continue wave
        var wave = JSON.parse(message);
        wave.prototype  = Wave;
        var waveName = wave["waveName"];
        var phase    = wave["phase"];
        compiledWave[waveName][phase].apply(wave,arguments);
    });
    return adaptor;
}

AdaptorBase.prototype.loadWaves = function(wavesFolder)
{
    var files = fs.readdirSync(wavesFolder);
    var adaptor = this;
    files.forEach(function (val, index, array){
        console.log("Uploading wave:" + val);
        var content = fs.readFileSync(wavesFolder+"\\"+val);
        adaptor.uploadCode(val,content);
    });
}

AdaptorBase.prototype.mkUri = function(type,value){
    return "wave://"+type+"/"+value;
}

AdaptorBase.prototype.uploadCode = function (name,content){
    redisClient.hset(adaptor.mkUri("system","code"), name,content);
}

AdaptorBase.prototype.loadMyCode =  function(){
    redisClient.hgetall(mkUri("system","code"),
        function (err, hash){
            for (var i in hash){
                compiledWave = eval(hash[i]);
            }
        });
}

function Wave(actorName,phase){
    this.actorName = actorName;
    this.phase     = phase;

}

Wave.prototype.play = function (actorName,waveName,phase,context){
    redisClient.publish(actorName,JSON.stringify(this));
}


AdaptorBase.prototype.startWave = function (waveName){
    var wave = new Wave();
    compiledWave[waveName]["start"].apply(wave,arguments);
}

