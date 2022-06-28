const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const mongoose = require("mongoose");

const app = require("./app");

process.on("uncaughtException", (err) => {
  console.error(err.name, err.message);
  server.close();
  process.exit(1);
});

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Db Connection Successfully!");
  })
  .catch((e) => console.log(e));

const server = app.listen(process.env.PORT, () => {
  console.log(`App starts at port ${process.env.PORT}...`);
});

process.on("unhandledRejection", (err) => {
  console.error(err.name, err.message);
  server.close();
  process.exit(1);
});
