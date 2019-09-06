const axios = require('axios');

const getStagesUrl = (baseUrl, jobName, buildNumber) =>
  `${baseUrl}/job/${jobName}/${buildNumber}/api/json?tree=actions[nodes[iconColor,running,displayName,id,parents]]`;
const getNodeUrl = (baseUrl, jobName, buildNumber, nodeId) => `${baseUrl}/job/${jobName}/${buildNumber}/execution/node/${nodeId}/wfapi/`;

const getRawStages = async (baseUrl, jobName, buildNumber) => {
  const resp = await axios.get(getStagesUrl(baseUrl, jobName, buildNumber));
  const actions = resp.data.actions;

  for (const action of actions) {
    if (action._class === 'org.jenkinsci.plugins.workflow.job.views.FlowGraphAction') {
      return action.nodes;
    }
  }

  return null;
};

const getJenkinsStages = async (baseUrl, jobName, buildNumber) => {
  const nodes = await getRawStages(baseUrl, jobName, buildNumber);

  let rootNode = null;

  const nodesById = {};
  nodes.forEach(node => {
    node.next = [];

    nodesById[node.id] = node;

    if (!node.parents || !node.parents.length) {
      rootNode = node;
    }
  });

  nodes.forEach(node => {
    node.parents.forEach(parentId => {
      const parent = nodesById[parentId];
      parent.next.push(node);
      if (parent.displayName.includes('Stage : Start')) {
        parent.displayName = 'Stage: ' + node.displayName;
      }
    });
  });

  const startNodes = ['org.jenkinsci.plugins.workflow.cps.nodes.StepStartNode', 'org.jenkinsci.plugins.workflow.graph.FlowStartNode'];
  const endNodes = ['org.jenkinsci.plugins.workflow.graph.FlowEndNode', 'org.jenkinsci.plugins.workflow.cps.nodes.StepEndNode'];

  // Create a new nested structure that's easier to understand and to traverse from the root node down
  // We lose information about steps that happened in parallel, but that's okay for our purposes
  const createNewGraph = (currentParent, node) => {
    node.children = [];

    if (endNodes.indexOf(node._class) >= 0) {
      currentParent = currentParent.parent;
    } else {
      if (currentParent) {
        if (currentParent.children.indexOf(node) === -1) {
          currentParent.children.push(node);
        }
        node.parent = currentParent;
      }
    }

    if (startNodes.indexOf(node._class) >= 0) {
      currentParent = node;
    }

    if (node.next && node.next.length) {
      node.next.forEach(n => createNewGraph(currentParent, n));
    }
  };

  createNewGraph(null, rootNode);

  const traverse = (prefix, node) => {
    const logUrl = node.log ? ` (logs: ${node.log})` : '';

    console.log(`${prefix} ${node.displayName}${logUrl}`);
    node.children.forEach(n => traverse(prefix + '-', n));
  };

  // traverse('', rootNode);

  //const allowedStrs = ['Shell Script', 'Start of Pipeline', 'Branch:', 'Archive', 'Stage : Start', 'Stage:'];

  // We want to filter out nodes that we don't really care about
  const allowedStrs = ['Start of Pipeline', 'Branch:', 'Stage : Start', 'Stage:'];
  const allowedNode = node => {
    return node._class === 'org.jenkinsci.plugins.workflow.cps.nodes.StepAtomNode' || !!allowedStrs.find(s => node.displayName.includes(s));
  };

  // Filter out nodes that we don't really care about, and bring their children up the graph
  // Also clean up properties we created earlier that we don't need anymore
  const fixNodes = (currentParent, node) => {
    const children = [...node.children];
    node.children = [];

    if (currentParent && allowedNode(node)) {
      currentParent.children.push(node);
    }

    const nextParent = allowedNode(node) ? node : currentParent;

    if (children && children.length) {
      children.forEach(nextNode => fixNodes(nextParent, nextNode));
    }

    delete node.next;
    delete node.parents;
    delete node.parent;
  };

  fixNodes(null, rootNode);

  // TODO make this parallel but with a max number in-flight
  // for (const node of nodes) {
  //   if (node.displayName.includes('Shell Script')) {
  //     const url = getNodeUrl(baseUrl, jobName, buildNumber, node.id);
  //     const data = (await axios.get(url)).data;
  //     node.parameterDescription = data.parameterDescription.replace(/#!\/usr\/local\/bin\/runbld\s+/, '');
  //     node.durationMillis = data.durationMillis;
  //     node.log = `${baseUrl}${data._links.log.href}`;
  //     node.console = `${baseUrl}/job/${jobName}/${buildNumber}/execution/node/${node.id}/log/?consoleFull`;
  //     node.status = data.status;
  //   }
  // }

  return rootNode;
};

module.exports = getJenkinsStages;
