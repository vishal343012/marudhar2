const { mongo_config, financialYearConfig } = require("./config/config");

const mongoose = require("mongoose");
mongoose.promise = Promise;

mongoose.connection.on('error', (err) => {
  console.log(err)
  process.exit(-1)
})

//MONGO_URI=mongodb://user:password@127.0.0.1:27017/dbname
//MONGO_URI=mongodb://user:password@127?keepAlive=true&poolSize=30
//&autoReconnect=true&socketTimeoutMS=360000&connectTimeoutMS=360000


exports.connect = (financialYearConnect) => {
  console.log(financialYearConnect, "fy")
  let financialDbConfig = ''

  if (mongoose.connection.readyState === 1) {
    mongoose.connection.close()
    financialDbConfig = financialYearConfig(financialYearConnect)
  }
  else { financialDbConfig = financialYearConfig(financialYearConnect) }
  console.log(financialDbConfig, "fy")
  mongoose
    .connect(financialDbConfig.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 30,
      socketTimeoutMS: 360000,
      family: 4,
      keepAlive: true,
      poolSize: 10,
      autoReconnect: true,
      socketTimeoutMS: 360000,
      connectTimeoutMS: 360000

    })
    .then(() => console.log("MongoDB Connected..."))
  return mongoose.connection;
}

// const connect = mongoose
//   .connect(mongo_config.mongoURI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//     keepAlive:true,
//   })
//   .then(() => console.log("MongoDB Connected..."))
//   .catch((err) => console.log(err));

// module.exports = connect;


