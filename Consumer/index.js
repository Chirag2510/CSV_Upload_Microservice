const express = require("express");
const amqp = require("amqplib/callback_api");
const Sequelize = require("sequelize");
const dotEnv = require("dotenv");
dotEnv.config();

const app = express();
const port = process.env.PORT || 3001;

//MySQL db connection using Sequelize
const sequelize = new Sequelize("test", "root", "root", {
  host: "localhost",
  dialect: "mysql",
});

const Employee = sequelize.define("employee", {
  employee_name: Sequelize.STRING,
  phone_number: Sequelize.STRING,
  email: Sequelize.STRING,
  company: Sequelize.STRING,
});

//RabbitMQ connection
amqp.connect(process.env.MESSAGE_BROKER_URL, function (err, connection) {
  if (err) throw err;

  connection.createChannel(function (err, channel) {
    if (err) throw err;

    const queue = "csv_emp_data";

    channel.assertQueue(queue, {
      durable: false,
    });

    console.log("Waiting for data...");

    channel.consume(
      queue,
      async function (msg) {
        const data = JSON.parse(msg.content.toString());

        //Insert data into MySQL database using Sequelize
        try {
          await sequelize.sync();
          await Employee.create(data);
          console.log("Inserted in db:", data);
          channel.ack(msg);
        } catch (err) {
          console.error("Error while inserting in db:", err);
        }
      },
      {
        noAck: false,
      }
    );
  });
});

app.listen(port, () => {
  console.log(`Consumer Service - Listen on port ${port}`);
});
