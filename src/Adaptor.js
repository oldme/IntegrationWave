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

var BROADCAST_ACTOR_NAME = "BROADCAST";

exports.init = function(actorName,redisHost,redisPort)
{
    console.log("Starting adaptor " + actorName);
    thisAdaptor = new AdaptorBase(actorName);
    redisClient = redis.createClient(redisPort,redisHost);
    pubsubRedisClient = redis.createClient(redisPort,redisHost);
    //broadcastRedisClient = redis.createClient(redisPort,redisHost);

    thisAdaptor.instanceUID = "UID:"+Date.now()+Math.random()+Math.random()+Math.random();

    thisAdaptor.compiledSwarmingDescriptions = [];
    thisAdaptor.msgCounter = 0;


    pubsubRedisClient.subscribe(actorName);
    //broadcastRedisClient.subscribe(BROADCAST_ACTOR_NAME);

    var cleanMessage = {
        scope:"broadcast",
        type:"start",
        actorName:actorName,
        instanceUID:thisAdaptor.instanceUID
    }


    /*broadcastRedisClient.on("message", function (channel, message) {
        var initVars = JSON.parse(message);
        thisAdaptor.onBroadcast(initVars);
    });*/

    //pubsubRedisClient.publish(actorName,JSON.stringify(cleanMessage));


    // handle messages from redis
    pubsubRedisClient.on("message", function (channel, message) {
        //continue swarmingPhase
        var initVars = JSON.parse(message);
        if(initVars.scope == "broadcast"){
            thisAdaptor.onBroadcast(initVars);
        }
        else{
            var swarmingPhase = new SwarmingPhase(initVars.swarmingName,initVars.currentPhase);
            thisAdaptor.msgCounter++;
            for (var i in initVars){
                swarmingPhase[i] = initVars[i];
            }
            swarmingPhase.msgCounter = thisAdaptor.msgCounter;
            if(swarmingPhase.debug == "true"){
                console.log("[" +thisAdaptor.actorName + "] received for [" + channel + "]: " + message);
            }
            var phaseFunction = thisAdaptor.compiledSwarmingDescriptions[swarmingPhase.swarmingName][swarmingPhase.currentPhase].code;
            phaseFunction.apply(swarmingPhase);
        }

    });

    return thisAdaptor;
}

AdaptorBase.prototype.uploadDescriptions = function(descriptionsFolder){
    var files = fs.readdirSync(descriptionsFolder);

    files.forEach(function (fileName, index, array){
        var fullFileName = descriptionsFolder+"\\"+fileName;

        printDebugMessages("Uploading wave:" + fileName);

        var content = fs.readFileSync(fullFileName);
        //console.log(this);
        redisClient.hset(thisAdaptor.mkUri("system","code"), fileName,content);

    });
}

AdaptorBase.prototype.readConfig = function(wavesFolder){
    var configContent = fs.readFileSync(wavesFolder+"\\core");
    thisAdaptor.adaptorConfig = JSON.parse(configContent);
    return thisAdaptor.adaptorConfig;
}

function printDebugMessages (msg){
    return false;
    console.log(msg);
}


AdaptorBase.prototype.mkUri = function(type,value){
    return "wave://"+type+"/"+value;
}


AdaptorBase.prototype.loadSwarmingCode =  function(){
    redisClient.hgetall(thisAdaptor.mkUri("system","code"),
        function (err, hash){
            for (var i in hash){
                printDebugMessages("Loading wave:" + i);
                try
                {
                    var obj = eval(hash[i]);
                    if(obj != null)
                    {
                        thisAdaptor.compiledSwarmingDescriptions[i] = obj;
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

function SwarmingPhase(waveName,phase){
    this.swarmingName       = waveName;
    this.currentPhase    = phase;
}

SwarmingPhase.prototype.swarm = function(phaseName){
    //console.log(this.waveName);
    //console.log(phaseName);
    this.currentPhase = phaseName;
    var targetActorName = thisAdaptor.compiledSwarmingDescriptions[this.swarmingName][phaseName].actor;
    if(this.debug == "true"){
            console.log("[" +thisAdaptor.actorName + "] is sending message for adaptor [" + targetActorName + "]: " + JSON.stringify(this));
    }
    redisClient.publish(targetActorName,JSON.stringify(this));
};

AdaptorBase.prototype.startWave = function (waveName){
    var wave = new SwarmingPhase(waveName,"start");
    //console.log(thisAdaptor.compiledWaves[waveName]);
    var initVars = thisAdaptor.compiledSwarmingDescriptions[waveName].vars;
    for (var i in initVars){
        wave[i] = initVars[i];
    }
    var start = thisAdaptor.compiledSwarmingDescriptions[waveName]["start"];
    var argsArray = Array.prototype.slice.call(arguments);
    argsArray.shift();
    start.apply(wave,argsArray);
}


AdaptorBase.prototype.onBroadcast = function(message){
    if(message.type == "start" && message.instanceUID != thisAdaptor.instanceUID){
    process.exit(999);
    }
    if(thisAdaptor.onBroadcastCallback != null){
        thisAdaptor.onBroadcastCallback(message);
    }
}
