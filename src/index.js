const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    // extract input
    const token = core.getInput('token', {required: true});
    const octokit = github.getOctokit(token);
    const {
        ref,
        payload
    } = github.context;
    const {repository} = payload;

    const repo = repository.name;
    const owner = repository.full_name.split('/')[0];

    console.log('github.context.ref', ref);

    const files = await octokit.repos.getCommit({
        owner,
        repo,
        ref,
    });

    files.data.map((file) => {
        console.log(file.filename);
    });

})().catch((error) => {
    core.setFailed(error);
    process.exit(1);
});
