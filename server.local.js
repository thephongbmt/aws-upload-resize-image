const app = require('./app')
app.listen(process.env.PORT || 3000, function () {
  console.info('Server listening at port ' + (process.env.PORT || 3000));
});