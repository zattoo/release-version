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
        quit('no changelog changes', 0);
    }

    changelogs.forEach((changelog) => {
        const {filename} = changelog;

        let [, project] = filename.split('/');

        core.info(`project ${project}`);
    });

})().catch((error) => {
    quit(error, 1);
});
