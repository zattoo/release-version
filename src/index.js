const core = require('@actions/core');
const exec = require('@actions/exec');
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
            core.info(`New ${versionAfter} candidate detected, preparing release...`);
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

    const release = async (project, item) => {
        const {version} = item;
        const releaseBranch = `release/${project}/${version.slice(0, -2)}`;
        const releaseUrl = `https://github.com/zattoo/cactus/tree/${releaseBranch}`;
        const patchBranch = `patch/${project}/${version}`;
        const first = Number(version[version.length - 1]) === 0;

        if (first) {
            core.info(`Creating release branch ${releaseBranch}...`);

            try {
                await octokit.rest.git.createRef({
                    owner,
                    repo,
                    ref: `refs/heads/${releaseBranch}`,
                    sha: after,
                });
                core.info(`Success: Branch ${releaseBranch} created.\nSee ${releaseUrl}`);
            } catch {
                core.info(`Release ${releaseBranch} already exist.\nSee ${releaseUrl}`);
            }
        } else {
            const {data: release} = await octokit.rest.git.getRef({
                owner,
                repo,
                ref: `heads/${releaseBranch}`,
            });

            const releaseSha = release.object.sha;

            await octokit.rest.git.createRef({
                owner,
                repo,
                ref: `refs/heads/${patchBranch}`,
                sha: releaseSha,
            });

            await octokit.rest.git.updateRef({
                owner,
                repo,
                ref: `heads/${patchBranch}`,
                sha: after,
                force: true,
            });

            await octokit.rest.pulls.create({
                owner,
                repo,
                title: `🍒 ${version}`,
                body: item.body,
                head: patchBranch,
                base: releaseBranch,
            });
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
})()
    .catch((error) => {
        exit(error, 1);
    });
