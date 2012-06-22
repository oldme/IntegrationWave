
var loginSwarming =
{
    vars:{
        isOk:false,
        clientSession:null,
        debug:"false"
    },
    start:function(clientSessionId,userId,authorisationToken){
        this.isOk=false;
        this.swarm("check");
        this.clientSessionId = clientSessionId;
        this.userId     =   userId;
        this.authorisationToken  =   authorisationToken;
    },
    check:{ //phase that should be replaced. Use your own security provider adaptor
        node:"Core",
        code : function (){
            if(this.authorisationToken == "ok"){
                this.isOk=true;
                this.swarm("success");
            }
            else{
                this.swarm("failed");
            }
        }
    },
    success:{   //phase
        node:"ClientAdaptor",
        code : function (){
            console.log("Success login for " + this.userId);
            thisAdaptor.findOutlet(this.clientSessionId).successfulLogin(this);
        }
    },

    failed:{   //phase
        node:"ClientAdaptor",
        code : function (){
            thisAdaptor.findOutlet(this.clientSessionId).close();
        }
    }
};

loginSwarming;