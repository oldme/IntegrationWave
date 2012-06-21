
function print(){
   console.log(this.msg);
}


var outlet={
            msg:"Outlet function got called",
            execute:print
};

outlet.execute();

function async(callBack){
    callBack();
}

async(outlet.execute.bind(outlet));


