const connection = require("./db-config");
const express = require("express");
const app = express();
const Joi = require("joi");

const PORT = process.env.PORT || 3000;

connection.connect((err) => {
  if (err) {
    console.error("error connecting: " + err.stack);
  } else {
    console.log(
      "connected to database with threadId :  " + connection.threadId
    );
  }
});

app.use(express.json());

//***********************  GET  ************************************/





app.get("/users", (req, res) => {
  connection.query("SELECT * FROM users", (err, result) => {
    if (err) {
      res.status(500).send("Error retrieving users from database");
    } else {
      res.json(result);
    }
  });
});

app.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  connection.query(
    "SELECT * FROM users WHERE id=?",
    [userId],
    (err, result) => {
      if (err) {
        res.status(500).send("Error retrieving user from database");
      } else {
        if (result.length) res.json(result[0]);
        else res.status(404).send("user not found");
      }
    }
  );
});



app.post("/users", (req, res) => {
  const { nom, prenom, email, langue, ville } = req.body;
  connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, result) => {
      if (result[0]) {
        console.log(err);
        res.status(409).json({ message: "This email is already used" });
      } else {
        const { error } = Joi.object({
          email: Joi.string().email().max(255).required(),
          nom: Joi.string().max(255).required(),
          prenom: Joi.string().max(255).required(),
          langue: Joi.string().max(255).required(),
          ville: Joi.string().max(255).required(),
        }).validate(
          { nom, prenom, email, langue, ville },
          { abortEarly: false }
        );
        if (error) {
          res.status(422).json({ validationErrors: error.details });
        } else {
          connection.query(
            "INSERT INTO users(nom, prenom, email, langue, ville) VALUES (?, ?, ?, ?, ?)",
            [nom, prenom, email, langue, ville],
            (err, result) => {
              if (err) {
                res.status(500).send("error saving users");
              } else {
                const id = result.insertId;
                const createdUser = { id, nom, prenom, email, ville, langue };
                res.status(201).json(createdUser);
              }
            }
          );
        }
      }
    }
  );
});

/*********************** PUT (MAJ) ********************************* */

app.put("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const db = connection.promise();
  let existingUser = null;
  let validationErrors = null;
  Promise.all([
    db.query("SELECT * FROM users WHERE id = ?", [userId]),
    db.query("SELECT * FROM users WHERE email = ? AND id <> ?", [
      req.body.email,
      userId,
    ]),
  ])
    .then(([[[existingUser]], [[otherUserWithEmail]]]) => {
      if (!existingUser) return Promise.reject("RECORD_NOT_FOUND");
      if (otherUserWithEmail) return Promise.reject("DUPLICATE_EMAIL");
      validationErrors = Joi.object({
        email: Joi.string().email().max(255),
        nom: Joi.string().min(1).max(255),
        prenom: Joi.string().min(1).max(255),
        ville: Joi.string().allow(null, "").max(255),
        language: Joi.string().allow(null, "").max(255),
      }).validate(req.body, { abortEarly: false }).error;
      if (validationErrors) return Promise.reject("INVALID_DATA");
      return db.query("UPDATE users SET ? WHERE id = ?", [req.body, userId]);
    })
    .then(() => {
      res.status(200).json({ ...existingUser, ...req.body });
    })
    .catch((err) => {
      console.error(err);
      if (err === "RECORD_NOT_FOUND")
        res.status(404).send(`User with id ${userId} not found.`);
      if (err === "DUPLICATE_EMAIL")
        res.status(409).json({ message: "This email is already used" });
      else if (err === "INVALID_DATA")
        res.status(422).json({ validationErrors });
      else res.status(500).send("Error updating a user");
    });
});


/****************** DELETE *********************** */

app.delete("/users/:id", (req, res) => {
  connection.query(
    "DELETE FROM users WHERE id=?",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error delete a user");
      } else {
        if (result.affectedRows) res.status(200).send("user deleted");
        else res.status(404).send("User not found");
      }
    }
  );
});



app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
