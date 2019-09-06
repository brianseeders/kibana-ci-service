var express = require('express');
var app = express();

const getJenkinsStages = require('./lib/getJenkinsStages');

const BASE_URL = process.env.BASE_URL || 'https://kibana-ci.elastic.co';
const PORT = process.env.PORT || 8080;

app.get('/:jobName/:buildNumber', async (req, res, next) => {
  console.log(`Request for ${req.path}`);

  try {
    const data = await getJenkinsStages(BASE_URL, req.params.jobName, req.params.buildNumber);
    res.json(data);
  } catch (ex) {
    next(ex, req, res);
  }
});

app.get('/health', (req, res) => {
  res.send();
});

app.use(function(err, req, res, next) {
  console.error(err.stack);

  res.status(500);
  let error = ({ message }) => ({ message });
  res.json({ error: error(err) });
});

app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));
