const getJenkinsStages = require('./lib/getJenkinsStages');

const BASE_URL = 'https://kibana-ci.elastic.co';
const JOB_NAME = 'kibana-pipeline-pull-request';
const BUILD_NUMBER = 8;

(async () => {
  const data = await getJenkinsStages(BASE_URL, JOB_NAME, BUILD_NUMBER);

  console.log(data);
})();
