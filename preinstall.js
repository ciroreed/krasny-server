var fs = require("fs");
var copyOrigin = "./structure",
    copyDestination = "../../",
    copyFile = function(file, dest){
        var destination = (dest + file).replace(copyOrigin, "");
        var readStream = fs.createReadStream(file);
        var writeStream = fs.createWriteStream(destination);

        readStream.pipe(writeStream);
    },
    createDir = function(directory){
        fs.mkdirSync(directory.replace(copyOrigin, copyDestination));
    },
    readDirectory = function(dir){
    fs.readdir(dir, function(err, data){
        data.forEach(function(file){
            fs.stat(dir + "/" + file, function(err, stats){
                if(stats.isDirectory()){
                    createDir(dir + "/" + file);
                    readDirectory(dir + "/" + file);
                }else{
                    copyFile(dir + "/" + file, copyDestination);
                }
            });
        });
    });
};


readDirectory(copyOrigin);
