const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    // extract input
    const token = core.getInput('token', {required: true});
    const octokit = github.getOctokit(token);
    const {
        sha,
        payload
    } = github.context;
    const {repository} = payload;

    const repo = repository.name;
    const owner = repository.full_name.split('/')[0];

    console.log('github.context.sha', sha);

    const files = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: sha,
    });

    console.log('files', files);

    files.data.map((file) => {
        console.log(file.filename);
    });

})().catch((error) => {
    core.setFailed(error);
    process.exit(1);
});
