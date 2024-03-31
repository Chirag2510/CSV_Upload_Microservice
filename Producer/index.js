const express = require("express");
const multer = require("multer");
const amqp = require("amqplib/callback_api");
const csv = require("csv-parser");
const fs = require("fs");
const dotEnv = require("dotenv");
dotEnv.config();

const app = express();
const upload = multer({ dest: "uploads/" });
const port = process.env.PORT || 3000;

app.post("/upload", upload.single("csv"), (req, res) => {
  //RabbitMQ connection
  amqp.connect(process.env.MESSAGE_BROKER_URL, function (err, connection) {
    if (err) throw err;

    connection.createChannel(function (err, channel) {
      if (err) throw err;

      const queue = "csv_emp_data";

      channel.assertQueue(queue, {
        durable: false,
      });

      //Read CSV file and send data to RabbitMQ
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on("data", (row) => {
          channel.sendToQueue(queue, Buffer.from(JSON.stringify(row)));
        })
        .on("end", () => {
          console.log("Successfully sent the data from CSV file to RabbitMQ");
          res.send("Successfully sent the data from CSV file to RabbitMQ");
          connection.close();
        });
    });
  });
});

app.listen(port, () => {
  console.log(`Producer Service - Listen on port ${port}`);
});
