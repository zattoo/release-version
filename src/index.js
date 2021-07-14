const core = require('@actions/core');
const github = require('@actions/github');
const parseChangelog = require('changelog-parser');
const _ = require('lodash');

// todo: add ignore label

const quit = (message, exitCode) => {
    if (exitCode === 1) {
        core.error(message);
    } else {
        core.info(message);
    }

    process.exit(exitCode);
};

const diff = (changelogBefore, changelogAfter) => {
    changelogAfter.versions.reverse().forEach((item, i) => {
        const versionAfter = item.version;
        const dateAfter = item.date;
        const bodyAfter = item.body;
        const itemBefore = changelogBefore.versions[i];
        const versionBefore = itemBefore.version;
        const dateBefore = itemBefore.date;
        const bodyBefore = itemBefore.body;

        if (!dateBefore && dateAfter) {
            core.info(`new ${versionAfter} candidate detected, preparing release...`)
            return;
        }

        if (
            (bodyAfter !== bodyBefore && dateBefore) ||
            (dateAfter !== dateBefore) ||
            (versionAfter !== versionBefore)
        ) {
            console.log('bodyAfter', bodyAfter);
            console.log('bodyBefore', bodyBefore);
            console.log('dateAfter', dateAfter);
            console.log('dateBefore', dateBefore);
            console.log('versionAfter', versionAfter);
            console.log('versionBefore', versionBefore);

            quit(`Version ${versionAfter} was already released, it cannot be modified.`, 1);
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
