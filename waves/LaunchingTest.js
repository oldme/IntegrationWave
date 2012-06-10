/**
 * Created with JetBrains WebStorm.
 * User: sinica
 * Date: 6/7/12
 * Time: 9:49 PM
 * To change this template use File | Settings | File Templates.
 */
var launchingTest =
{
        vars:{
            message:"Hello World"
        },
        start:function(){
                    this.message+="!";
                    this.swarm("begin");
                },
        begin:{ //phase
            actor:"core",
            code : function (){
                    this.message="Hello World!"+" The swarming has began! ";
                    this.swarm("endTest");
                }
        },
        endTest:{   //phase
            actor:"core",
            code : function (){
                    console.log(this.message);
                }
        }
};

launchingTest;