const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    // extract input
    const token = core.getInput('token', {required: true});
    const octokit = github.getOctokit(token);

    const repo = github.context.payload.repository.name;
    const owner = github.context.payload.repository.full_name.split('/')[0];

    console.log('github.context.sha', github.context.sha);

    const files = await octokit.repos.getCommit({
        owner,
        repo,
        ref: github.context.sha,
    });

    return files.data.map((file) => file.filename);

})().catch((error) => {
    core.setFailed(error);
    process.exit(1);
});
