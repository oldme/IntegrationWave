/**
 * User: sinica
 * Date: 6/7/12
 * Time: 9:49 PM
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
            node:"core",
            code : function (){
                    this.message="Hello World!"+" The swarming has began! ";
                    this.swarm("endTest");
                }
        },
        endTest:{   //phase
            node:"core",
            code : function (){
                    console.log(this.message);
                }
        }
};

launchingTest;