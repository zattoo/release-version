const core = require('@actions/core');
const github = require('@actions/github');
const parseChangelog = require('changelog-parser');
const _ = require('lodash');

// todo: add ignore label

const quit = (message, exitCode) => {
    core.info(message);
    process.exit(exitCode);
};

const diff = (changelogBefore, changelogAfter) => {
    changelogAfter.versions.forEach((item, i) => {
        const versionAfter = item.version;
        const dateAfter = item.date;
        const bodyAfter = item.date;

        const itemBefore = changelogBefore.versions[i];

        if (!itemBefore) {
            return; // new entry added
        }

        const versionBefore = item.version;
        const dateBefore = item.date;
        const bodyBefore = item.date;

        if (bodyAfter !== bodyBefore && dateBefore) {
            quit('already released entry was modified', 1);
        }
    });
};

(async () => {
    const token = core.getInput('token', {required: true});
    const octokit = github.getOctokit(token);

    const {context} = github;
    const {payload} = context;
    const {
        after,
        before,
        repository,
    } = payload;

    const repo = repository.name;
    const owner = repository.full_name.split('/')[0];

    const commit = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: after,
    });

    const {files} = commit.data;

    if (_.isEmpty(files)) {
        quit('no changes', 0);
    }

    const changelogs = files.filter((file) => file.filename.includes('CHANGELOG.md'));

    if (_.isEmpty(changelogs)) {
        quit('no changelog changes', 0);
    }

    const loop = async (item) => {
        const {filename} = item;

        const split = filename.split('/');
        const project = split[split.length - 2];

        core.info(`project ${project}`);

        const [contentBefore, contentAfter] = await Promise.all([
            await octokit.rest.repos.getContent({
                owner,
                repo,
                path: filename,
                ref: before,
            }),
            await octokit.rest.repos.getContent({
                owner,
                repo,
                path: filename,
                ref: after,
            }),
        ]);

        const [changelogBefore, changelogAfter] = await Promise.all([
            await parseChangelog({text: Buffer.from(contentBefore.data.content, 'base64').toString()}),
            await parseChangelog({text: Buffer.from(contentAfter.data.content, 'base64').toString()}),
        ]);

        diff(changelogBefore, changelogAfter);
    };

    await Promise.all(changelogs.map(loop));
})().catch((error) => {
    quit(error, 1);
});
