/**
 * Created with JetBrains WebStorm.
 * User: sinica
 * Date: 6/7/12
 * Time: 9:49 PM
 * To change this template use File | Settings | File Templates.
 */
var benchmark =
{
        vars:{
            count:0,
            maxCount:0,
            startTime:0,
            debug:"false"
        },
        start:function(maxCount){
                    this.startTime = Date.now();
                    this.maxCount = maxCount;
                    this.phase("tick");
                    console.log("Starting benchmark for " + maxCount + " phases!");
                },
        tick:{
            actor:"core",
            code : function (){
                    this.count      = parseInt(this.count);
                    this.maxCount   = parseInt(this.maxCount);
                    this.count++;
                    if(this.count < this.maxCount){
                        this.phase("tick");
                    }
                    else{
                        this.phase("printResults");
                    }
                }
        },
        printResults:{
            actor:"core",
            code : function (){
                var ct = Date.now();
                var max = parseInt(this.maxCount);
                var diff = (ct - parseInt(this.startTime))/1000;

                var speed = "Not enough phases requested!";
                if(diff != 0){
                    speed = "" + Math.ceil(max / diff) + " phase changes per second!";
                }

                console.log("Benchmark results: " + speed + " Time spent: " + diff + "seconds");
            }
        }
};

benchmark;