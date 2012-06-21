/**
 * Created with JetBrains WebStorm.
 * User: sinica
 * Date: 6/21/12
 * Time: 2:03 PM
 * To change this template use File | Settings | File Templates.
 */

var loginSwarming =
{
    vars:{
        isOk:false,
        clientSession:null
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
            thisAdaptor.findOutlet(this.clientSessionId).successfullLogin(this);
        }
    }

    failed:{   //phase
        node:"ClientAdaptor",
        code : function (){

            console.log(this.message);
        }
    }
};

loginSwarming;