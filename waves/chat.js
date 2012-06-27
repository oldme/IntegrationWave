
var addChatMsgSwarming =
{
    vars:{
        userId:false,
        date:null,
        message:null,
        roomId:null,
        debug:"swarm1",
        action:null
    },
    start:function(roomId,userId,date,message,userFriendlyRoomName){
        this.roomId     = roomId;
        this.userId     = userId;
        this.date       = date;
        this.message    = message;
        this.userFriendlyRoomName = userFriendlyRoomName;
        this.swarm("recordMsg");
    },
    recordMsg:{
        node:"ChatPersistence",
        code : function (){
            this.saveChat(this.roomId,this.userId,this.date,this.message);
            this.swarm("notify");
        }
    },
    notify:{   //phase
        node:"NotificationService",
        code : function (){
            var followers = this.getFollowers(this.roomId);
            for (var i in followers){
                this.currentTargetUser = i;
                if(i != this.userId){
                    this.swarm("directNotification",i);
                }
            }
        }
    },
    directNotification:{   //notify connected clients
        node:"ClientAdaptor",
        code : function (){
            var clientNodeName = this.findConnectedClientByUserId(this.currentTargetUser);
            if(clientNodeName){
                this.swarm("home",clientNodeName);
            }
            else {
                this.swarm("mailNotification");
            }
        }
    },
    home:{   //phase executed on connected clients that are following a room and should get notified about a new chat message
        node:"$client",
        code : null
    },
    mailNotification:{   //phase executed on connected clients that are following a room and should get notified about a new chat message
        node:"mailNotificator",
        code : function (){
            this.scheduleNotification("1d",this.roomId,"New chat message for " + this.userFriendlyRoomName);
        }
    }
};

addChatMsgSwarming;