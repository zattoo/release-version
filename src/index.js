const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    // extract input
    const token = core.getInput('token', {required: true});
    const octokit = github.getOctokit(token);

    const repo = github.context.payload.repository.name;
    const owner = github.context.payload.repository.full_name.split('/')[0];


    console.log(repo);
    console.log(owner);

})().catch((error) => {
    core.setFailed(error);
    process.exit(1);
});
