require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const routes = require('./app/routes');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

routes(app);

app.use(function(request, response) {
    response.status(404).send({ url: request.originalUrl + ' not found' })
});

app.listen(process.env.DB_PORT, () => {
    console.log(`Server is listening on port ${process.env.DB_PORT}`)
});
