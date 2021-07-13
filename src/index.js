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
        sha: current_sha,
        payload
    } = context;

    const {repository} = payload;

    const repo = repository.name;
    const owner = repository.full_name.split('/')[0];

    const commit = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: current_sha,
    });

    const {files} = commit.data;

    if (_.isEmpty(files)) {
        quit('no changes', 0);
    }

    const changelogs = files.filter((file) => file.filename.includes('CHANGELOG.md'));

    if (_.isEmpty(changelogs)) {
        quit('no changelog changes', 0);
    }

    const proceed = async (item) => {
        const {filename} = item;

        const split = filename.split('/');
        const project = split[split.length - 2];

        core.info(`project ${project}`);

        const content = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: filename,
            ref: current_sha,
        });

        core.info(content);
    };

    await Promise.all(changelogs.map(proceed));
})().catch((error) => {
    quit(error, 1);
});
