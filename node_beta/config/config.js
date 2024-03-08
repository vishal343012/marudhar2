const prodconfig = {
  AWS_ACCESS_KEY: "AKIAW7AWAGAZAUO3PAXW",
  AWS_SECRET_ACCESS_KEY: "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",
  Bucket: "document.marudhar.app",
  Acl: "public-read",
  ChunkSize: 100 * 1024 * 1024,
  region: "eu-west-1",
};

const betaconfig = {
  AWS_ACCESS_KEY: "AKIAW7AWAGAZAUO3PAXW",
  AWS_SECRET_ACCESS_KEY: "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",
  Bucket: "document.marudhar.app",
  Acl: "public-read",
  ChunkSize: 100 * 1024 * 1024,
  region: "eu-west-1",
};

const devconfig = {
  AWS_ACCESS_KEY: "AKIAW7AWAGAZAUO3PAXW",
  AWS_SECRET_ACCESS_KEY: "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",
  Bucket: "document.marudhar.app",
  Acl: "public-read",
  ChunkSize: 100 * 1024 * 1024,
  region: "eu-west-1",
};

const prodmongoconfig = {
  mongoURI:
    // "mongodb+srv://tanusree:tanusree@cluster0.rdfei.mongodb.net/test"
    "mongodb://production:Ef94StxHZsLjT1m6@marudharapp-shard-00-00.x9ypj.mongodb.net:27017,marudharapp-shard-00-01.x9ypj.mongodb.net:27017,marudharapp-shard-00-02.x9ypj.mongodb.net:27017/db_marudhar_live?ssl=true&replicaSet=atlas-o1duxv-shard-0&authSource=admin&retryWrites=true&w=majority"
  ,
};


const betamongoconfig = {
  mongoURI:
    ///OLD
    // "mongodb+srv://marudhar:Nyszzf4eErxNkOOc@learning.gdytw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
    "mongodb://production:Ef94StxHZsLjT1m6@marudharapp-shard-00-00.x9ypj.mongodb.net:27017,marudharapp-shard-00-01.x9ypj.mongodb.net:27017,marudharapp-shard-00-02.x9ypj.mongodb.net:27017/beta?ssl=true&replicaSet=atlas-o1duxv-shard-0&authSource=admin&retryWrites=true&w=majority"
};

const devmongoconfig = {
  mongoURI:
    "mongodb://127.0.0.1:27017/fy_2023-2024_281123?readPreference=primary&directConnection=true&ssl=false",
  //
};


const PORT = process.env.PORT || 3000;
const BetaPort = 3010;

const smtp_config = {
  port: 587,
  host: "",
  secure: false,
  auth: {
    user: "",
    pass: "",
  },
  from: "Notification <email@domain.com>",
};

const devAPI_URL = "http://localhost:3000/";
// const betaAPI_URL = "https://api.marudhar.app/betaAPI/";
const betaAPI_URL = "https://beta-api.marudhar.app/";
const prodAPI_URL = "https://api.marudhar.app/";

let config = {};
let mongo_config = {};
let apiURL = "";
let port = PORT;

let dirName = __dirname.split("/");

const serverDIR = dirName[dirName.length - 2];

let betaFlag = false

if (serverDIR === "node_beta") {
  betaFlag = true;
}

let financialYearConfig = (fy) => {
  console.log(fy,"new")
    //Fy DB
    const prodmongoconfigFy = {
      mongoURI:
        // "mongodb+srv://tanusree:tanusree@cluster0.rdfei.mongodb.net/test"
        `mongodb://production:Ef94StxHZsLjT1m6@marudharapp-shard-00-00.x9ypj.mongodb.net:27017,marudharapp-shard-00-01.x9ypj.mongodb.net:27017,marudharapp-shard-00-02.x9ypj.mongodb.net:27017/fy_${fy}?ssl=true&replicaSet=atlas-o1duxv-shard-0&authSource=admin&retryWrites=true&w=majority`
      ,
    };
  
    const prodmongoconfigFy1 = {
      mongoURI:
        // "mongodb+srv://tanusree:tanusree@cluster0.rdfei.mongodb.net/test"
        `mongodb://production:Ef94StxHZsLjT1m6@marudharapp-shard-00-00.x9ypj.mongodb.net:27017,marudharapp-shard-00-01.x9ypj.mongodb.net:27017,marudharapp-shard-00-02.x9ypj.mongodb.net:27017/fy_2023-2024?ssl=true&replicaSet=atlas-o1duxv-shard-0&authSource=admin&retryWrites=true&w=majority`
      ,
    };
    const betamongoconfigFy = {
      mongoURI:
        ///OLD
        // "mongodb+srv://marudhar:Nyszzf4eErxNkOOc@learning.gdytw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
        `mongodb://production:Ef94StxHZsLjT1m6@marudharapp-shard-00-00.x9ypj.mongodb.net:27017,marudharapp-shard-00-01.x9ypj.mongodb.net:27017,marudharapp-shard-00-02.x9ypj.mongodb.net:27017/beta_fy_${fy}?ssl=true&replicaSet=atlas-o1duxv-shard-0&authSource=admin&retryWrites=true&w=majority`
    };
  
    const devmongoconfigFy = {
      mongoURI:
        `mongodb://127.0.0.1:27017/fy_${fy}?readPreference=primary&directConnection=true&ssl=false`,
      //
    };
  //////////////////////////////////////// login check 
    if (fy === "2022-2023") {
  
      if (process.env.NODE_ENV === "production" && betaFlag === false) {
  
        return mongo_config = prodmongoconfigFy1;
  
      } else if (process.env.NODE_ENV === "development" && betaFlag === true) {
        console.log("reched beta")
  
        return mongo_config = prodmongoconfig;
  
      } else {
        return mongo_config = prodmongoconfigFy1; //devmongoconfig // prodmongoconfig for beta  // prodmongoconfigFy1 for live
      }
    }
    else {
  
      if (process.env.NODE_ENV === "production" && betaFlag === false) {
        console.log("reched prod")
        return mongo_config = prodmongoconfigFy1;
  
      } else if (process.env.NODE_ENV === "development" && betaFlag === true) {
        console.log("reched beta")
  
        return mongo_config = betamongoconfigFy;
  
      } else {
        console.log("reched deve")
        return mongo_config = prodmongoconfigFy1; //devmongoconfig // prodmongoconfig for beta  // prodmongoconfigFy1 for live
      }
    }
}
  

if (process.env.NODE_ENV === "production" && betaFlag === false) {
  config = prodconfig;
  // mongo_config = prodmongoconfig;
  apiURL = prodAPI_URL;
  port = PORT;
} else if (!process.env.NODE_ENV && betaFlag === true) {
  console.log("reched beta")
  config = betaconfig;
  // mongo_config = betamongoconfig;
  apiURL = betaAPI_URL;
  port = PORT;
} else {
  config = devconfig //devconfig; //; prodconfig//;
  //devmongoconfig; betamongoconfig prodmongoconfig//;
  apiURL = devAPI_URL;
  port = PORT;
}

// console.log(process.env.NODE_ENV)
// console.log(mongo_config)
console.log("Connected as: ", betaFlag, (betaFlag === false ? process.env.NODE_ENV : "Beta"));
console.log(mongo_config);
const CurrencyAPI = "https://APIURL";


module.exports = { financialYearConfig, config, mongo_config, smtp_config, CurrencyAPI, apiURL, port };



//old
// const prodconfig = {
//   AWS_ACCESS_KEY: "AKIAW7AWAGAZAUO3PAXW",
//   AWS_SECRET_ACCESS_KEY: "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",
//   Bucket: "document.marudhar.app",
//   Acl: "public-read",
//   ChunkSize: 100 * 1024 * 1024,
//   region: "eu-west-1",
// };

// const betaconfig = {
//   AWS_ACCESS_KEY: "AKIAW7AWAGAZAUO3PAXW",
//   AWS_SECRET_ACCESS_KEY: "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",
//   Bucket: "document.marudhar.app",
//   Acl: "public-read",
//   ChunkSize: 100 * 1024 * 1024,
//   region: "eu-west-1",
// };

// const devconfig = {
//   AWS_ACCESS_KEY: "AKIAW7AWAGAZAUO3PAXW",
//   AWS_SECRET_ACCESS_KEY: "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",
//   Bucket: "document.marudhar.app",
//   Acl: "public-read",
//   ChunkSize: 100 * 1024 * 1024,
//   region: "eu-west-1",
// };
// const prodmongoconfig = {
//   mongoURI:
//   // "mongodb+srv://tanusree:tanusree@cluster0.rdfei.mongodb.net/test"
//   "mongodb://production:Ef94StxHZsLjT1m6@marudharapp-shard-00-00.x9ypj.mongodb.net:27017,marudharapp-shard-00-01.x9ypj.mongodb.net:27017,marudharapp-shard-00-02.x9ypj.mongodb.net:27017/db_marudhar_live?ssl=true&replicaSet=atlas-o1duxv-shard-0&authSource=admin&retryWrites=true&w=majority"
//   ,
// };
// // const prodmongoconfig = {
// //   mongoURI:
// //     "mongodb+srv://production:Ef94StxHZsLjT1m6@marudharapp.x9ypj.mongodb.net/db_marudhar_live?retryWrites=true&w=majority",
// // };

// const betamongoconfig = {
//   mongoURI:
//     "mongodb+srv://marudhar:Nyszzf4eErxNkOOc@learning.gdytw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
// };

// const devmongoconfig = {
//   mongoURI:
//     "mongodb://127.0.0.1:27017/db_test?readPreference=primary&directConnection=true&ssl=false",
//   //
// };


// const PORT = process.env.PORT || 3000;
// const BetaPort = 3010;

// const smtp_config = {
//   port: 587,
//   host: "",
//   secure: false,
//   auth: {
//     user: "",
//     pass: "",
//   },
//   from: "Notification <email@domain.com>",
// };

// const devAPI_URL = "http://localhost:3000/";
// const betaAPI_URL = "https://api.marudhar.app/betaAPI/";
// const prodAPI_URL = "https://api.marudhar.app/";
// const killAPI_URL = "goggle.com"

// let config = {};
// let mongo_config = {};
// let apiURL = "";
// let port = PORT;
// let killSwitch = false;

// let dirName = __dirname.split("/");
// const serverDIR = dirName[dirName.length - 2];
// let betaFlag = false
// if (serverDIR === "node_beta") {
//   betaFlag = false;
// }
// if (killSwitch === true){
//   config = "";
//   mongo_config = "";
//   apiURL = "";
//   port = "";
// } else {


// if (process.env.NODE_ENV === "production" && betaFlag === false) {
//   config = prodconfig;
//   mongo_config = prodmongoconfig;
//   apiURL = prodAPI_URL;
//   port = PORT;
// } else if (process.env.NODE_ENV === "production" && betaFlag === true) {
//   config = betaconfig;
//   mongo_config = betamongoconfig;
//   apiURL = betaAPI_URL;
//   port = BetaPort;
// } else {
//   config = devconfig //devconfig; //; prodconfig//;
//   mongo_config = devmongoconfig// prodmongoconfig; //; ; devmongoconfig//;
//   apiURL = devAPI_URL;
//   port = PORT;
// }
// }

// // console.log(process.env.NODE_ENV)
// // console.log(mongo_config)
// console.log("Connected as: ", (betaFlag === false ? process.env.NODE_ENV : "Beta"));
// console.log(mongo_config);
// const CurrencyAPI = "https://APIURL";


// module.exports = { config, mongo_config, smtp_config, CurrencyAPI, apiURL, port };