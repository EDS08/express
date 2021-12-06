const connection = require('./db-config');
const { setupRoutes } = require('./routes');
const express = require('express');
const app = express();
const Joi = require('joi');

const port = process.env.PORT || 3000;

connection.connect((err) => {
  if (err) {
    console.error('error connecting: ' + err.stack);
  } else {
    console.log('connected as id ' + connection.threadId);
  }
});

app.use(express.json());

setupRoutes(app);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});