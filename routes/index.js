const authRouter = require('./auth');
const moviesRouter = require('./films');
const usersRouter = require('./users');

const setupRoutes = (app) => {
  app.use('/movies', moviesRouter);
  app.use('/users', usersRouter);
  app.use('/auth', authRouter);
  // TODO later : app.use('/api/users', usersRouter);
};

module.exports = {
  setupRoutes,
};