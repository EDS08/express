const connection = require('../db-config');
const Joi = require('joi');
const argon2 = require('argon2');

const db = connection.promise();

//*********************** VALIDATION AVEC JOI *******************************************/

const validate = (data, forCreation = true) => {
  const presence = forCreation ? 'required' : 'optional';
  return Joi.object({
    email: Joi.string().email().max(255).presence(presence),
    nom: Joi.string().max(255).presence(presence),
    prenom: Joi.string().max(255).presence(presence),
    ville: Joi.string().allow(null, '').max(255),
    langue: Joi.string().allow(null, '').max(255),
    password: Joi.string().allow(null, '').max(255),
  }).validate(data, { abortEarly: false }).error;
};

//**************************** RECHERCHE ********************************************* */

const findMany = ({ filters: { langue } }) => {
  let sql = 'SELECT * FROM users';
  const sqlValues = [];
  if (langue) {
    sql += ' WHERE langue = ?';
    sqlValues.push(langue);
  }

  return db.query(sql, sqlValues).then(([results]) => results);
};

const findOne = (id) => {
  return db
    .query('SELECT * FROM users WHERE id = ?', [id])
    .then(([results]) => results[0]);
};

const findByEmail = (email) => {
  return db
    .query('SELECT * FROM users WHERE email = ?', [email])
    .then(([results]) => results[0]);
};

const findByEmailWithDifferentId = (email, id) => {
  return db
    .query('SELECT * FROM users WHERE email = ? AND id <> ?', [email, id])
    .then(([results]) => results[0]);
};

const create = ({ nom, prenom, email, langue, ville, password }) => {
  return hashPassword(password).then((hashedPassword) => {
    return db
      .query('INSERT INTO users SET ?', {
        nom,
        prenom,
        email,
        langue,
        ville,
        hashedPassword,
      })
      .then(([result]) => {
        const id = result.insertId;
        return { nom, prenom, ville, langue, email, id };
      });
  });
};

const update = (id, newAttributes) => {
  return db.query('UPDATE users SET ? WHERE id = ?', [newAttributes, id]);
};

const destroy = (id) => {
  return db
    .query('DELETE FROM users WHERE id = ?', [id])
    .then(([result]) => result.affectedRows !== 0);
};

//****************************************** PASSWORD HASH AVEC ARGON2*/

const hashingOptions = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 5,
  parallelism: 1,
};

const hashPassword = (plainPassword) => {
  return argon2.hash(plainPassword, hashingOptions);
};

const verifyPassword = (plainPassword, hashedPassword) => {
  return argon2.verify(hashedPassword, plainPassword, hashingOptions);
};

module.exports = {
  findMany,
  findOne,
  validate,
  create,
  update,
  destroy,
  findByEmail,
  findByEmailWithDifferentId,
  hashPassword,
  verifyPassword,
};