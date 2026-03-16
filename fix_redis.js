const fs = require("fs"); 
for (let file of ["server/v1/modules/user/userController.js", "server/v1/modules/hostel/hostelController.js"]) { 
    let f = fs.readFileSync(file, "utf8"); 
    
    // Remove local redis init
    f = f.replace(/const redis = require\([^)]+\)\.createClient\([^)]+\);[\s\S]*?redis\.connect\(\);/, "");
    f = f.replace(/const \{ createClient \} = require\("redis"\);[\s\S]*?const redis = createClient[\s\S]*?redis\.connect\(\);/g, "");
    
    // Add global redisClient requirement
    if (!f.includes("redisClient.js")) {
        f = "const redisClient = require(\"../../utils/redisClient.js\");\n" + f;
    }

    // Replace basic methods
    f = f.replace(/redis\.del\(/g, "redisClient.del("); 
    f = f.replace(/redis\.get\(/g, "redisClient.get("); 
    f = f.replace(/redis\.isReady/g, "true"); 

    // Proper parser for redis.setEx(key, time, value)
    let lines = f.split("\n");
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("redis.setEx(")) {
            let idx = lines[i].indexOf("redis.setEx(");
            let prefix = lines[i].substring(0, idx);
            let rest = lines[i].substring(idx + "redis.setEx(".length);
            
            let parts = [];
            let inParenCount = 0;
            let currentPart = "";
            let remainingString = "";

            for (let j = 0; j < rest.length; j++) {
                let char = rest[j];
                if (char === '(') inParenCount++;
                else if (char === ')') inParenCount--;

                if (char === ',' && inParenCount === 0) {
                    parts.push(currentPart.trim());
                    currentPart = "";
                } else if (inParenCount === -1 && char === ')') {
                    parts.push(currentPart.trim());
                    remainingString = rest.substring(j + 1);
                    break;
                } else {
                    currentPart += char;
                }
            }
            if (parts.length === 3) {
                let key = parts[0];
                let time = parts[1];
                let value = parts[2];
                // Replace in line
                lines[i] = `${prefix}await redisClient.set(${key}, ${value}, 'EX', ${time})${remainingString}`;
            }
        }
    }
    
    fs.writeFileSync(file, lines.join('\n')); 
}