const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/auth')
const worksRouter = require('./routes/workspace');
const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use('/', routes);
app.use('/api', worksRouter);

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});