const express = require("express");
const Sequelize = require("sequelize");
const dotEnv = require("dotenv");
dotEnv.config();

const app = express();
const port = process.env.PORT || 3002;

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

app.get("/employees", async (req, res) => {
  let where = {};

  const { company, email, page, limit } = req.query;

  if (company) {
    where.company = company;
  }

  if (email) {
    where.email = email;
  }

  let offset = 0;
  if (page && limit) {
    offset = (page - 1) * limit;
  }

  //Retrieve the employees based on specified condition
  try {
    const employees = await Employee.findAll({
      where: where,
      offset: offset,
      limit: limit ? parseInt(limit) : undefined,
    });
    res.json(employees);
  } catch (err) {
    console.error("Error while fetching employees details:", err);
  }
});

app.listen(port, () => {
  console.log(`Data Query Service - Listen on port ${port}`);
});
