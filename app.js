const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//1) POST API user Register
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const getSqlQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getSqlQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userRegisterQuery = `INSERT INTO user (username, name, password, gender, location) VALUES ( '${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      const dbResponse = await db.run(userRegisterQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//2) POST Login User
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserDetailsQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(getUserDetailsQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, dbUser.password);
    if (true === isPasswordCorrect) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//3) PUT Change Password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserDetailsQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await db.get(getUserDetailsQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    if (oldPassword.length < 5) {
      response.send(400);
      response.send("Password is too short");
    } else {
      const isPasswordCorrect = await bcrypt.compare(
        oldPassword,
        dbUser.password
      );
      if (isPasswordCorrect === true) {
        if (newPassword.length < 5) {
          response.status(400);
          response.send("Password is too short");
        } else {
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          const newPasswordUpdateQuery = `UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}';`;
          await db.run(newPasswordUpdateQuery);
          response.status(200);
          response.send("Password updated");
        }
      } else {
        response.status(400);
        response.send("Invalid current password");
      }
    }
  }
});

module.exports = app;
