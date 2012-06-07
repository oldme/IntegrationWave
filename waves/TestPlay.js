/**
 * Created with JetBrains WebStorm.
 * User: sinica
 * Date: 6/7/12
 * Time: 9:49 PM
 * To change this template use File | Settings | File Templates.
 */
{
        waveName:"TestPlay",
        start:function(){
                    message="Hello World!"
                    play(ping);
                },
        ping:{
            actor="core",
            code = function (){
                    message="Hello World!"+" Scripts are running in BlueCloud!";
                    play(pong);
                }
        },
        pong:{
            actor="core",
            code = function (){
                    console.log(message);
                }
        }
};

