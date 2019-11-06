const axios = require('axios');

const getJobsUrl = baseUrl =>
  `${baseUrl}/api/json/?tree=jobs[description,displayName,fullDisplayName,fullName,name,url,color,inQueue,_class,builds[building,description,displayName,duration,executor,id,number,result,timestamp,url,builtOnqueueId]]`;

const getJobs = async baseUrl => {
  const resp = await axios.get(getJobsUrl(baseUrl));
  return resp.data.jobs;
};

module.exports = getJobs;
