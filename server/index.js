const express = require('express');

const app = express();

const { setup } = require('radiks-server');
require('dotenv').config()


// setup({
//     mongoDBUrl: 'mongodb://localhost:27017/radiks-server'
//   }).then((RadiksController) => {
//     app.use('/radiks', RadiksController);
//   });

setup({
    mongoDBUrl: process.env.MONGO_URI
  }).then((RadiksController) => {
    app.use('/radiks', RadiksController);
  });

app.get('/', (req, res) => {
  console.log("this is the home route")
});


const port = process.env.PORT || 5000;

app.listen(port, () => `Server running on port ${port}`);