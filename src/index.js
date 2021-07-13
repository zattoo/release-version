const core = require('@actions/core');
const github = require('@actions/github');
const _ = require('lodash');

const quit = (message, exitCode) => {
    core.info(message);
    process.exit(exitCode);
};

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

    const {files} = commit.data;

    if (_.isEmpty(files)) {
        quit('no changes', 0);
    }

    const changelogs = files.filter((file) => file.filename.includes('CHANGELOG.md'));

    if (_.isEmpty(changelogs)) {
        quit('no changelogs changes', 0);
    }
})().catch((error) => {
    quit(error, 1);
});
