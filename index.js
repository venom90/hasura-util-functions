// Initialize
require('./initialize');

const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch")
const fs = require('fs');
const cors = require('cors');
const PORT = process.env.PORT || 4111;
const util = require('./lib/util');

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));

app.use(cors());

// Root
app.get('/', (_req, res) => res.send('void'));

// Health Check API
app.get('/health', (_req, res) => res.send('ok'));


// Include routes
require('./functions')(app);


app.listen(PORT, () => util.showInfo(`Hasura util functions server started on port ${PORT}`));