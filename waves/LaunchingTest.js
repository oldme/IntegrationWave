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
                    this.phase("begin");
                },
        begin:{
            actor:"core",
            code : function (){
                    aaa
                    this.message="Hello World!"+" The swarming has began! ";
                    this.phase("endTest");
                }
        },
        endTest:{
            actor:"core",
            code : function (){
                    console.log(this.message);
                }
        }
};

launchingTest;