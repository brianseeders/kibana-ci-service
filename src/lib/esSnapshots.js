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
};
