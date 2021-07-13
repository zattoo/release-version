const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    const token = core.getInput('token', {required: true});
    const octokit = github.getOctokit(token);
    const {context} = github;
    const {
        sha,
        payload
    } = context;
    const {repository} = payload;

    const repo = repository.name;
    const owner = repository.full_name.split('/')[0];

    core.info(`commit: ${sha}`);

    const commit = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
    });

    console.dir(commit);

})().catch((error) => {
    core.setFailed(error);
    process.exit(1);
});
