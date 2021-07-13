const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    // extract input
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

    const base = context.payload.before;
    const head = context.payload.after;

    core.info(`commit: ${sha}`);

    console.log('rest', octokit.rest);

    const commit = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
    });

    core.info(commit);

})().catch((error) => {
    core.setFailed(error);
    process.exit(1);
});
