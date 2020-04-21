//

const axios = require('axios');

const getKibanaPackage = async (branch) => {
  const resp = await axios.get(`https://raw.githubusercontent.com/elastic/kibana/${branch}/package.json`);
  return resp.data;
};

const getManifest = async (version, getVerified = false) => {
  try {
    return await axios.get(`https://storage.googleapis.com/kibana-ci-es-snapshots-daily/${version}/manifest-latest.json`);
  } catch (ex) {
    console.error(`Error getting snapshot manifest for version ${version}`, ex.toString());
  }

  return { data: null };
};

const getBuilds = async (baseUrl) => {
  const url = `${baseUrl}/job/elasticsearch+snapshots+verify/api/json/?tree=builds[building,description,displayName,duration,executor,id,number,result,timestamp,url,builtOnqueueId,artifacts]`;
  const resp = await axios.get(url);

  return resp.data.builds;
};

const getInfoForBranches = async (baseUrl, branches) => {
  const [builds, ...branchData] = await Promise.all([getBuilds(baseUrl), ...branches.map(getSnapshotInfo)]);
  for (const branch of branchData) {
    branch.latestJenkinsBuild = builds.find((build) => build.displayName.match(`- ${branch.version}$`));
  }

  return branchData;
};

const getSnapshotInfo = async (branch) => {
  const { version } = await getKibanaPackage(branch);
  const [latest, latestVerified] = await Promise.all([
    getManifest(version, false),
    axios.get(`https://storage.googleapis.com/kibana-ci-es-snapshots-daily/${version}/manifest-latest-verified.json`),
  ]);

  return { version, branch, snapshots: { latest: latest.data, latestVerified: latestVerified.data } };
};

module.exports = {
  getKibanaPackage,
  getSnapshotInfo,
  getInfoForBranches,
};
