/**
 * Created by: sinica
 * Date: 6/7/12
 * Time: 11:36 PM
 */

var redis = require("redis");
var fs = require('fs');

function AdaptorBase(nodeName){
    this.nodeName = nodeName;
}

var BROADCAST_NODE_NAME = "BROADCAST";

exports.init = function(nodeName,redisHost,redisPort)
{

    console.log("Starting adaptor " + nodeName);
    thisAdaptor = new AdaptorBase(nodeName);
    redisClient = redis.createClient(redisPort,redisHost);
    pubsubRedisClient = redis.createClient(redisPort,redisHost);
    thisAdaptor.instanceUID = "UID:"+Date.now()+Math.random()+Math.random()+Math.random();

    thisAdaptor.compiledSwarmingDescriptions = [];
    thisAdaptor.msgCounter = 0;
    pubsubRedisClient.subscribe(nodeName);
    thisAdaptor.redisHost = redisHost;
    thisAdaptor.redisPort = redisPort;


    var cleanMessage = {
        scope:"broadcast",
        type:"start",
        nodeName:nodeName,
        instanceUID:thisAdaptor.instanceUID
    }

    // handle messages from redis
    pubsubRedisClient.on("message", function (channel, message) {
        //continue swarmingPhase
        var initVars = JSON.parse(message);
        if(initVars.scope == "broadcast"){
            thisAdaptor.onBroadcast(initVars);
        }
        else{
            thisAdaptor.onMessageFromQueue(initVars,message);
        }
    });

    return thisAdaptor;
}

AdaptorBase.prototype.onMessageFromQueue = function(initVars,rawMessage){
    var swarmingPhase = new SwarmingPhase(initVars.swarmingName,initVars.currentPhase);
    thisAdaptor.msgCounter++;
    for (var i in initVars){
        swarmingPhase[i] = initVars[i];
    }

    if(swarmingPhase.debug == "true"){
        console.log("[" +thisAdaptor.nodeName + "] received for [" + channel + "]: " + rawMessage);
    }
    var phaseFunction = thisAdaptor.compiledSwarmingDescriptions[swarmingPhase.swarmingName][swarmingPhase.currentPhase].code;
    if(phaseFunction != null){
        phaseFunction.apply(swarmingPhase);
    }

    else{
        if(thisAdaptor.onMessageCallback != null){
            thisAdaptor.onMessageCallback(message);
        }
        else{
                Console.log("DROPPING unknown message: " + rawMessage);
        }
    }
}

AdaptorBase.prototype.uploadDescriptions = function(descriptionsFolder){
    var files = fs.readdirSync(descriptionsFolder);

    files.forEach(function (fileName, index, array){
        var fullFileName = descriptionsFolder+"\\"+fileName;

        printDebugMessages("Uploading swarming:" + fileName);

        var content = fs.readFileSync(fullFileName);
        //console.log(this);
        redisClient.hset(thisAdaptor.mkUri("system","code"), fileName,content);

    });
}

AdaptorBase.prototype.readConfig = function(swarmingsFolder){
    var configContent = fs.readFileSync(swarmingsFolder+"\\core");
    thisAdaptor.adaptorConfig = JSON.parse(configContent);
    return thisAdaptor.adaptorConfig;
}

function printDebugMessages (msg){
    return false;
    console.log(msg);
}


AdaptorBase.prototype.mkUri = function(type,value){
    return "swarming://"+type+"/"+value;
}


AdaptorBase.prototype.loadSwarmingCode =  function(){
    redisClient.hgetall(thisAdaptor.mkUri("system","code"),
        function (err, hash){
            for (var i in hash){
                printDebugMessages("Loading swarming phase:" + i);
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

function SwarmingPhase(swarmingName,phase){
    this.swarmingName       = swarmingName;
    this.currentPhase    = phase;
}

SwarmingPhase.prototype.swarm = function(phaseName){
    //console.log(this.swarmingName);
    //console.log(phaseName);
    this.currentPhase = phaseName;
    var targetActorName = thisAdaptor.compiledSwarmingDescriptions[this.swarmingName][phaseName].node;
    if(this.debug == "true"){
            console.log("[" +thisAdaptor.nodeName + "] is sending message for adaptor [" + targetActorName + "]: " + JSON.stringify(this));
    }
    redisClient.publish(targetActorName,JSON.stringify(this));
};

AdaptorBase.prototype.startSwarming = function (swarmingName){
    var swarming = new SwarmingPhase(swarmingName,"start");
    //console.log(thisAdaptor.compiledWaves[swarmingName]);
    var initVars = thisAdaptor.compiledSwarmingDescriptions[swarmingName].vars;
    for (var i in initVars){
        swarming[i] = initVars[i];
    }
    var start = thisAdaptor.compiledSwarmingDescriptions[swarmingName]["start"];
    var argsArray = Array.prototype.slice.call(arguments);
    argsArray.shift();
    start.apply(swarming,argsArray);
}

SwarmingPhase.prototype.startWave = AdaptorBase.prototype.startWave;


AdaptorBase.prototype.onBroadcast = function(message){
    if(message.type == "start" && message.instanceUID != thisAdaptor.instanceUID){
        console.log("["+thisAdaptor.nodeName+"] Forcing process exit because an node with the same name got alive!");
    process.exit(999);
    }
    if(thisAdaptor.onBroadcastCallback != null){
        thisAdaptor.onBroadcastCallback(message);
    }
}

function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return "0x"+hex;
}

function writeFastJSON(sock,str){ //write size and JSON serialised form of the object
    var sizeLine=decimalToHex(str.length)+"\n";
    sock.write(sizeLine);
    sock.write(str+"\n");
}

function newOutlet(socketParam){
    var outlet={
        redisClient:null,
        socket:socketParam,
        clientSessionId:null,
        onChannelNewMessage:function (channel, message) {
            writeFastJSON(socket,message);
        },
        onLogin:function (clientSessionId) {
            this.redisClient = redis.createClient(thisAdaptor.redisPort,thisAdaptor.redisHost);
            this.redisClient.subscribe(clientSessionId);
            this.redisClient.on("message",outlet.onChannelNewMessage);
        }
        succesLogin:function(){
            this.execute = this.executeSafe;
        },
        execute : null;
        executeButNotAuthenticated : function (messageObj){
            if(messageObj.swarmingName != "ClientLogin.js"){
                Console.log("Could not execute [" +messageObj.swarmingName +"] swarming without being logged in");
            }
            else{
                executeSafe(messageObj);
            }
        },

        executeSafe : function (messageObj){
                if(messageObj.command == "start"){
                    var swarming = new SwarmingPhase(messageObj.swarmingName,"start");
                    //console.log(thisAdaptor.compiledWaves[swarmingName]);
                    var initVars = thisAdaptor.compiledSwarmingDescriptions[swarmingName].vars;
                    for (var i in initVars){
                        swarming[i] = initVars[i];
                    }

                    for (var i in messageObj){
                        swarming[i] = initVars[i];
                    }

                    var start = thisAdaptor.compiledSwarmingDescriptions[messageObj.swarmingName]["start"];
                    var argsArray = Array.prototype.slice.call();
                    argsArray.shift();
                    start.apply(swarming,messageObj.commandArguments);
                }
                else
                if(messageObj.command == "phase"){
                    var swarming = new SwarmingPhase(messageObj.swarmingName,messageObj);
                    swarming.swarm(swarming.currentPhase);
                }
                else{
                    Console.log("["+thisAdaptor.nodeName +"] I don't know what to execute "+ JSON.stringify(messageObj));
                }

            }
    };
    outlet.execute = outlet.executeButNotAuthenticated;
    return outlet;
}


