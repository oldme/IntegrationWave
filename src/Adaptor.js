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
    thisAdaptor = new AdaptorBase(actorName);
    redisClient = redis.createClient(redisPort,redisHost);

    thisAdaptor.compiledWaves = [];

    pubsubRedisClient = redis.createClient(redisPort,redisHost);
    pubsubRedisClient.subscribe(actorName);
    // handle messages from redis
    pubsubRedisClient.on("message", function (channel, message) {
        //continue wave
        var initVars = JSON.parse(message);
        var wave = new Wave(initVars.waveName,initVars.currentPhase);
        for (var i in initVars){
            wave[i] = initVars[i];
        }
        if(wave.debug == "true"){
            console.log("Got message " + channel + ": " + message);
        }
        var phaseFunction = thisAdaptor.compiledWaves[wave.waveName][wave.currentPhase].code;
        phaseFunction.apply(wave);
    });

    return thisAdaptor;
}

AdaptorBase.prototype.uploadWaves = function(wavesFolder)
{
    var files = fs.readdirSync(wavesFolder);
    files.forEach(function (fileName, index, array){
        console.log("Uploading wave:" + fileName);
        var content = fs.readFileSync(wavesFolder+"\\"+fileName);
        //console.log(this);
        redisClient.hset(thisAdaptor.mkUri("system","code"), fileName,content);
    });
}

AdaptorBase.prototype.mkUri = function(type,value){
    return "wave://"+type+"/"+value;
}


AdaptorBase.prototype.loadMyCode =  function(){
    redisClient.hgetall(thisAdaptor.mkUri("system","code"),
        function (err, hash){
            for (var i in hash){
                console.log("Loading wave:" + i);
                try
                {
                    var obj = eval(hash[i]);
                    if(obj != null)
                    {
                        thisAdaptor.compiledWaves[i] = obj;
                    }
                    else
                    {
                        console.log("Failed to load " + i);
                    }
                    //console.log(thisAdaptor.compiledWaves[i]);
                }
                catch(err)
                {
                    console.log(err);
                }
            }
        });
}

function Wave(waveName,phase){
    this.waveName       = waveName;
    this.currentPhase    = phase;
}

Wave.prototype =
    {
        phase : function(phaseName){
            //console.log(this.waveName);
            //console.log(phaseName);
            this.currentPhase = phaseName;
            var targetActorName = thisAdaptor.compiledWaves[this.waveName][phaseName].actor;
            redisClient.publish(targetActorName,JSON.stringify(this));
        }
    }

AdaptorBase.prototype.startWave = function (waveName){
    var wave = new Wave(waveName,"start");
    //console.log(thisAdaptor.compiledWaves[waveName]);
    var initVars = thisAdaptor.compiledWaves[waveName].vars;
    for (var i in initVars){
        wave[i] = initVars[i];
    }
    var start = thisAdaptor.compiledWaves[waveName]["start"];
    var argsArray = Array.prototype.slice.call(arguments);
    argsArray.shift();
    start.apply(wave,argsArray);
}

