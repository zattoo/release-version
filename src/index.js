const core = require('@actions/core');
const github = require('@actions/github');
const parseChangelog = require('changelog-parser');
const _ = require('lodash');

// todo: add ignore label

let foundSomething = false;

const exit = (message, exitCode) => {
    if (exitCode === 1) {
        core.error(message);
    } else {
        core.info(message);
    }

    process.exit(exitCode);
};

const getNewVersions = (changelogBefore, changelogAfter) => {
    let newVersions = [];

    const mapBefore = changelogBefore.versions.reduce((result, item) => {
        return {
            ...result,
            [item.version]: item,
        };
    }, {});

    changelogAfter.versions.forEach((item) => {
        const versionAfter = item.version;
        const dateAfter = item.date;
        const bodyAfter = item.body;

        const itemBefore = mapBefore[versionAfter] || {};

        const versionBefore = itemBefore.version;
        const dateBefore = itemBefore.date;
        const bodyBefore = itemBefore.body;

        if (!dateBefore && dateAfter) {
            core.info(`new ${versionAfter} candidate detected, preparing release...`)
            foundSomething = true;
            newVersions.push(item);
        }

        if (
            dateBefore && (
                (bodyBefore !== bodyAfter) ||
                (dateBefore !== dateAfter) ||
                (versionBefore !== versionAfter)
            )
        ) {
            exit(`Version ${versionAfter} was already released, it cannot be modified.`, 1);
        }

    });

    return newVersions;
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
        exit('No changes', 0);
    }

    const changelogs = files.filter((file) => file.filename.includes('CHANGELOG.md'));

    if (_.isEmpty(changelogs)) {
        exit('No changelog changes', 0);
    }

    const release = async (project, version) => {
        const branch = `release/${project}/${version.version.slice(0, -2)}`;

        core.info(`Releasing ${branch}`);

        try {
            const response = await octokit.rest.git.createRef({
                owner,
                repo,
                ref: `refs/heads/${branch}`,
                sha: after,
            });
            console.log(response);
        } catch (e) {
            console.log('error', e);
        }
    };

    const analyzeChangelog = async (item) => {
        const {filename} = item;

        const split = filename.split('/');
        const project = split[split.length - 2];

        core.info(`Analyzing ${project} project...`);

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

        const newVersions = getNewVersions(changelogBefore, changelogAfter);

        if (!_.isEmpty(newVersions)) {
            await Promise.all(newVersions.map((version) => release(project, version)));
        }
    };

    await Promise.all(changelogs.map(analyzeChangelog));

    if (!foundSomething) {
        exit('No release candidates were found', 0);
    }
})().catch((error) => {
    exit(error, 1);
});
