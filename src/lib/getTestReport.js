const axios = require('axios');

const getUrl = (baseUrl, jobName, buildNumber) =>
  `${baseUrl}/job/${jobName}/${buildNumber}/testReport/api/json?tree=suites[duration,enclosingBlockNames,name,nodeId,timestamp,cases[className,name,status]]`;

const getTestReport = async (baseUrl, jobName, buildNumber) => {
  console.log(getUrl(baseUrl, jobName, buildNumber));

  const resp = await axios.get(getUrl(baseUrl, jobName, buildNumber));
  resp.data.suites = resp.data.suites || [];

  resp.data.suites.forEach(suite => {
    suite.cases = suite.cases.filter(c => c.status !== 'PASSED' && c.status !== 'SKIPPED');
  });

  resp.data.suites = resp.data.suites.filter(suite => suite.cases && suite.cases.length);
  return resp.data;
};

module.exports = getTestReport;

// https://kibana-ci.elastic.co/job/elastic+kibana+master/1023/testReport/api/json?tree=suites[cases[className,name,status]]
